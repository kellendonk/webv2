import {
  AssetStaging,
  aws_certificatemanager,
  aws_cloudfront,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  Distribution,
  FunctionEventType,
  IOrigin,
  PriceClass,
} from 'aws-cdk-lib/aws-cloudfront';
import { LambdaRestApi, MethodLoggingLevel } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs';
import * as path from 'path';
import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';
import { RecordTarget } from 'aws-cdk-lib/aws-route53';
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
  readonly restApiOrigin: IOrigin;

  /**
   * The assets origin where all static assets live.
   */
  readonly assetsOrigin: IOrigin;

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

    const handler = new DockerImageFunction(this, 'Handler', {
      code: DockerImageCode.fromImageAsset(distDir),
      tracing: aws_lambda.Tracing.ACTIVE,
    });

    new LambdaBlowtorch(this, 'HandlerWarming', {
      target: handler,
      desiredConcurrency: 3,
      warmingInterval: Duration.minutes(1),
      warmingPayload: JSON.stringify(API_GATEWAY_REQUEST),
    });

    const restApi = new LambdaRestApi(this, 'Api', {
      handler,
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    const assets = new Bucket(this, 'Assets');

    // Deploy the static assets to the bucket. Note: We don't prune here. This
    // is so that users currently on the site don't fail when they try to load
    // static assets such as page js files.
    new BucketDeployment(this, 'DeployStaticAssets', {
      destinationBucket: assets,
      destinationKeyPrefix: '_next/static',
      sources: [Source.asset(`${distDir}/.next/static`)],
    });

    this.assetsOrigin = new S3Origin(assets);
    this.restApiOrigin = new RestApiOrigin(restApi);
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
  readonly recordTarget: RecordTarget;

  constructor(scope: Construct, id: string, props: SsrWebsiteCdnProps) {
    super(scope, id);

    const { website } = props;

    const cachePolicy = new CachePolicy(this, 'SSRCachePolicy', {
      minTtl: Duration.seconds(1),
      maxTtl: Duration.days(30),
      defaultTtl: Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: CacheHeaderBehavior.allowList('X-Website-Hash'),
      cookieBehavior: CacheCookieBehavior.none(),
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

    const distribution = new Distribution(this, 'Distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      enableLogging: true,
      certificate: props.domainConfig?.certificate,
      domainNames: props.domainConfig?.domainNames,
      defaultBehavior: {
        origin: website.restApiOrigin,
        cachePolicy,
        functionAssociations: [
          {
            eventType: FunctionEventType.VIEWER_REQUEST,
            function: viewerRequest,
          },
        ],
      },
      additionalBehaviors: {
        '/_next/static/*': { origin: website.assetsOrigin },
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
