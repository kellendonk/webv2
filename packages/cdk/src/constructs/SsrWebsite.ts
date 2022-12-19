import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';
import {
  AssetStaging,
  aws_apigateway,
  aws_certificatemanager,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  aws_s3_deployment,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as fs from 'fs';
import * as path from 'path';

import { API_GATEWAY_REQUEST } from './events';

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
  readonly restApiOrigin: aws_cloudfront.IOrigin;

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

    const restApi = new aws_apigateway.LambdaRestApi(this, 'Api', {
      handler,
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
      },
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
    this.restApiOrigin = new aws_cloudfront_origins.RestApiOrigin(restApi);
  }
}

export interface SsrWebsiteCdnProps {
  readonly website: SsrWebsite;

  /** Domain configuration */
  readonly domainConfig?: {
    certificate: aws_certificatemanager.ICertificate;
    domainNames: string[];
  };
}

export class SsrWebsiteCdn extends Construct {
  readonly cdnDomainName: string;
  readonly recordTarget: aws_route53.RecordTarget;

  constructor(scope: Construct, id: string, props: SsrWebsiteCdnProps) {
    super(scope, id);

    const { website } = props;

    const cachePolicy = new aws_cloudfront.CachePolicy(this, 'SSRCachePolicy', {
      minTtl: Duration.seconds(1),
      maxTtl: Duration.days(30),
      defaultTtl: Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior:
        aws_cloudfront.CacheHeaderBehavior.allowList('X-Website-Hash'),
      cookieBehavior: aws_cloudfront.CacheCookieBehavior.none(),
    });

    const code = fs.readFileSync(
      path.join(__dirname, 'SsrWebsite.ViewerRequest.js'),
      'utf8',
    );

    const viewerRequest = new aws_cloudfront.Function(this, 'ViewerRequest', {
      functionName: [...this.node.path.split('/'), 'ViewerRequest'].join('-'),
      code: aws_cloudfront.FunctionCode.fromInline(
        scriptSub(code, {
          WEBSITE_HASH: website.hash,
        }),
      ),
    });

    const distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      enableLogging: true,
      certificate: props.domainConfig?.certificate,
      domainNames: props.domainConfig?.domainNames,
      defaultBehavior: {
        origin: website.restApiOrigin,
        cachePolicy,
        functionAssociations: [
          {
            eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: viewerRequest,
          },
        ],
        viewerProtocolPolicy:
          aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/_next/static/*': {
          origin: website.assetsOrigin,
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });

    this.cdnDomainName = distribution.distributionDomainName;
    this.recordTarget = aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.CloudFrontTarget(distribution),
    );
  }
}

export function scriptSub(
  script: string,
  props: Record<string, string>,
): string {
  return Object.entries(props).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
    script,
  );
}
