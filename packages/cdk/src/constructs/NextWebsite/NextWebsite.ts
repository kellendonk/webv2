import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';
import {
  AssetStaging,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  Duration,
  Stack,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apiv2_int from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

import { API_GATEWAY_REQUEST } from './warming-event';

export interface NextWebsiteProps {
  /**
   * The directory containing the build output for the Next.js application.
   * We expect a Dockerfile in the directory, so we can build a container.
   */
  readonly distDir: string;
}

/**
 * Responsible for creating the hosting for a nextjs site.
 */
export class NextWebsite extends Construct {
  /**
   * The hash of the asset backing the deployed website. You can use this as a
   * cache key.
   */
  readonly hash: string;

  readonly httpDomain: string;

  readonly assetsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: NextWebsiteProps) {
    super(scope, id);

    const distDir = props.distDir;

    // Calculate a hash for the website by staging its assets and taking the
    // asset hash.
    const stagedDistAsset = new AssetStaging(this, 'StagedDistAsset', {
      sourcePath: distDir,
    });

    this.hash = stagedDistAsset.assetHash;

    const handler = new lambda.DockerImageFunction(this, 'Handler', {
      code: lambda.DockerImageCode.fromImageAsset(distDir),
      tracing: lambda.Tracing.ACTIVE,
    });

    // Reduce cold starts when someone hasn't visited the site in several
    // minutes by sending a minimum amount of synthetic traffic to the lambda.
    new LambdaBlowtorch(this, 'HandlerWarming', {
      target: handler,
      desiredConcurrency: 3,
      warmingInterval: Duration.minutes(1),
      warmingPayload: JSON.stringify(API_GATEWAY_REQUEST),
    });

    const httpApi = new apiv2.HttpApi(this, 'HttpApi', {
      defaultIntegration: new apiv2_int.HttpLambdaIntegration(
        'Handler',
        handler,
      ),
    });

    const assets = new s3.Bucket(this, 'Assets');

    // Deploy the static assets to the bucket. Note: We don't prune here. This
    // is so that users currently on the site don't fail when they try to load
    // static assets such as page js files.
    new s3deploy.BucketDeployment(this, 'DeployStaticAssets', {
      destinationBucket: assets,
      destinationKeyPrefix: '_next/static',
      sources: [s3deploy.Source.asset(`${distDir}/.next/static`)],
    });

    const region = Stack.of(this).region;
    const apiDomain = `${httpApi.apiId}.execute-api.${region}.amazonaws.com`;

    this.assetsBucket = assets;
    this.httpDomain = apiDomain;
  }
}
