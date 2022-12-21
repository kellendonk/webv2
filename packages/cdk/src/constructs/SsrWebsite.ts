import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';
import {
  AssetStaging,
  aws_certificatemanager,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  aws_s3_deployment,
  Duration,
  Stack,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as aws_apigatewayv2_integration from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

import { API_GATEWAY_REQUEST } from './events';
import { DomainConfig } from './DomainConfig';

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

export interface SsrWebsiteCdnProps {
  readonly website: SsrWebsite;

  /** Domain configuration */
  readonly domainConfig?: DomainConfig;
}

export class SsrWebsiteCdn extends Construct {
  readonly cdnDomainName: string;
  readonly recordTarget: aws_route53.RecordTarget;

  constructor(scope: Construct, id: string, props: SsrWebsiteCdnProps) {
    super(scope, id);

    const { website, domainConfig } = props;

    const cachePolicy = new aws_cloudfront.CachePolicy(this, 'SSRCachePolicy', {
      minTtl: Duration.seconds(1),
      maxTtl: Duration.days(30),
      defaultTtl: Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior:
        aws_cloudfront.CacheHeaderBehavior.allowList('X-Website-Hash'),
      cookieBehavior: aws_cloudfront.CacheCookieBehavior.none(),
      queryStringBehavior: aws_cloudfront.CacheQueryStringBehavior.all(),
    });

    const viewerRequest = new aws_cloudfront.Function(this, 'ViewerRequest', {
      functionName: [...this.node.path.split('/'), 'ViewerRequest'].join('-'),
      code: aws_cloudfront.FunctionCode.fromInline(
        cdnFunction({
          websiteHash: website.hash,
          primaryDomain: domainConfig?.domainName,
        }),
      ),
    });

    // Ensure that the website is deployed first before we change the viewer
    // request function so the website hash cache key doesn't flip too soon.
    viewerRequest.node.addDependency(website);

    const distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      ...this.domainConfigDistributionProps(domainConfig),
      priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      enableLogging: true,
      httpVersion: aws_cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: website.ssrOrigin,
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
          responseHeadersPolicy: new aws_cloudfront.ResponseHeadersPolicy(
            this,
            'StaticResponseHeadersPolicy',
            {
              customHeadersBehavior: {
                customHeaders: [
                  {
                    header: 'Cache-Control',
                    value: 'public,max-age=31536000,immutable',
                    override: true,
                  },
                ],
              },
            },
          ),
        },
      },
    });

    this.cdnDomainName = distribution.distributionDomainName;
    this.recordTarget = aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.CloudFrontTarget(distribution),
    );
  }

  private domainConfigDistributionProps(
    domainConfig: DomainConfig,
  ): Partial<aws_cloudfront.DistributionProps> {
    if (!domainConfig) {
      return {};
    }

    return {
      domainNames: domainConfig.domainNames,
      certificate: new aws_certificatemanager.DnsValidatedCertificate(
        this,
        'Domain',
        {
          domainName: domainConfig.domainName,
          subjectAlternativeNames: domainConfig.secondaryDomainNames,
          hostedZone: domainConfig.hostedZone,
          region: 'us-east-1',
        },
      ),
    };
  }
}

interface CdnFunctionProps {
  readonly websiteHash: string;
  readonly primaryDomain?: string;
}

/**
 * Renders a CloudFront function responsible for transforming requests
 * just as they're passed to CloudFront.
 */
export function cdnFunction(props: CdnFunctionProps): string {
  return `
var props = ${JSON.stringify(props)};

function handler(event) {
  var request = event.request;

  // Redirect to the primary domain
  if (props.primaryDomain && request.headers.host.value !== props.primaryDomain) {
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: {
        location: {
          value: "https://" + props.primaryDomain + request.uri
        }
      }
    };
  }

  // Add the website hash as a cache key
  request.headers['x-website-hash'] = { value: props.websiteHash };

  return request;
}
  `;
}
