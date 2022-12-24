import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';
import {
  AssetStaging,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_lambda,
  aws_s3,
  aws_s3_deployment,
  Duration,
  Stack,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as aws_apigatewayv2_integration from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

import { API_GATEWAY_REQUEST } from './warming-event';

export interface SsrWebsiteProps {
  /**
   * The directory containing the build output for the Next.js application.
   * We expect a Dockerfile in the directory, so we can build a container.
   */
  readonly distDir: string;
}

/**
 * Responsible for creating the hosting for a nextjs site.
 */
export class SsrWebsite extends Construct {
  /**
   * The REST API origin where the lambda handlers reside.
   */
  readonly ssrOrigin: aws_cloudfront.IOrigin;

  /**
   * The assets origin where all static assets live.
   */
  readonly assetsOrigin: aws_cloudfront.IOrigin;

  /**
   * The hash of the asset backing the deployed website. You can use this as a
   * cache key.
   */
  readonly hash: string;

  constructor(scope: Construct, id: string, props: SsrWebsiteProps) {
    super(scope, id);

    const distDir = props.distDir;

    const stagedDistAsset = new AssetStaging(this, 'StagedDistAsset', {
      sourcePath: distDir,
    });

    this.hash = stagedDistAsset.assetHash;

    const handler = new aws_lambda.DockerImageFunction(this, 'Handler', {
      code: aws_lambda.DockerImageCode.fromImageAsset(distDir),
      tracing: aws_lambda.Tracing.ACTIVE,
    });

    new LambdaBlowtorch(this, 'HandlerWarming', {
      target: handler,
      desiredConcurrency: 3,
      warmingInterval: Duration.minutes(1),
      warmingPayload: JSON.stringify(API_GATEWAY_REQUEST),
    });

    const httpApi = new aws_apigatewayv2.HttpApi(this, 'HttpApi', {
      defaultIntegration:
        new aws_apigatewayv2_integration.HttpLambdaIntegration(
          'Handler',
          handler,
        ),
    });

    const assets = new aws_s3.Bucket(this, 'Assets');

    // Deploy the static assets to the bucket. Note: We don't prune here. This
    // is so that users currently on the site don't fail when they try to load
    // static assets such as page js files.
    new aws_s3_deployment.BucketDeployment(this, 'DeployStaticAssets', {
      destinationBucket: assets,
      destinationKeyPrefix: '_next/static',
      sources: [aws_s3_deployment.Source.asset(`${distDir}/.next/static`)],
    });

    this.assetsOrigin = new aws_cloudfront_origins.S3Origin(assets);
    this.ssrOrigin = new aws_cloudfront_origins.HttpOrigin(
      `${httpApi.apiId}.execute-api.${Stack.of(this).region}.amazonaws.com`,
    );
  }
}
