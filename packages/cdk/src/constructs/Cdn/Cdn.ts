import { Construct } from 'constructs';
import { aws_cloudfront, Duration } from 'aws-cdk-lib';
import { DomainName, DomainNameBinding } from '../DomainName';
import { SsrWebsite } from '../SsrWebsite';
import { Api } from '../Api';

export interface CdnProps {
  /** The website */
  readonly website: SsrWebsite;

  /** The API */
  readonly api: Api;

  /**
   * The domain name to bind to the distribution
   * @default - use the default CloudFront domain name
   */
  readonly domainName?: DomainName;
}

/**
 * Responsible for creating the CDN distribution.
 */
export class Cdn extends Construct {
  readonly domainName: string;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    const { website, domainName } = props;

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
          primaryDomain: domainName?.domainName,
        }),
      ),
    });

    // Ensure that the website is deployed first before we change the viewer
    // request function so the website hash cache key doesn't flip too soon.
    viewerRequest.node.addDependency(website);

    const distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: website.origin,
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
      enableIpv6: true,
      enableLogging: true,
      httpVersion: aws_cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
    });

    distribution.addBehavior('/_next/static/*', website.assetsOrigin, {
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
    });

    distribution.addBehavior('/graphql', props.api.origin, {
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
      viewerProtocolPolicy:
        aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      responseHeadersPolicy: new aws_cloudfront.ResponseHeadersPolicy(
        this,
        'ApiResponseHeadersPolicy',
        {
          corsBehavior: {
            accessControlAllowCredentials: false,
            accessControlAllowHeaders: ['*'],
            accessControlAllowMethods: ['ALL'],
            accessControlAllowOrigins: [
              'http://localhost:4200',
              'http://127.0.0.1:4200',
            ],
            accessControlMaxAge: Duration.seconds(600),
            originOverride: true,
          },
        },
      ),
    });

    domainName?.bind(DomainNameBinding.cloudFront(distribution));

    this.domainName =
      domainName?.domainName ?? distribution.distributionDomainName;
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
