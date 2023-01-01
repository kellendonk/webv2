import {
  aws_cloudfront as cf,
  aws_cloudfront_origins as cfo,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { renderName } from '../util';
import { NextWebsite } from './index';
import { DomainName } from '../DomainName';
import { IDefaultCdnOrigin } from '../Cdn';

export interface NextWebsiteOriginProps {
  readonly website: NextWebsite;
  readonly domainName?: DomainName;
}

export class NextWebsiteCdnOrigin
  extends Construct
  implements IDefaultCdnOrigin
{
  readonly defaultBehavior: cf.BehaviorOptions;
  readonly additionalBehaviors: Record<string, cf.BehaviorOptions>;

  constructor(scope: Construct, id: string, props: NextWebsiteOriginProps) {
    super(scope, id);

    const { website, domainName } = props;

    const cachePolicy = new cf.CachePolicy(this, 'CachePolicy', {
      minTtl: Duration.seconds(1),
      maxTtl: Duration.days(30),
      defaultTtl: Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cf.CacheHeaderBehavior.allowList('X-Website-Hash'),
      cookieBehavior: cf.CacheCookieBehavior.none(),
      queryStringBehavior: cf.CacheQueryStringBehavior.all(),
    });

    const viewerRequestFn = new WebOriginRequestFn(this, 'ViewerRequestFn', {
      websiteHash: website.hash,
      primaryDomain: domainName?.domainName,
    });

    // Ensure that the website is deployed first before we change the viewer
    // request function so the website hash cache key doesn't flip too soon.
    viewerRequestFn.node.addDependency(website);

    this.defaultBehavior = {
      origin: new cfo.HttpOrigin(website.httpDomain),
      cachePolicy,
      functionAssociations: [
        {
          eventType: cf.FunctionEventType.VIEWER_REQUEST,
          function: viewerRequestFn,
        },
      ],
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    this.additionalBehaviors = {
      '/_next/static/*': {
        origin: new cfo.S3Origin(website.assetsBucket),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,

        // Ensure static assets have cache settings.
        responseHeadersPolicy: new StaticHeadersPolicy(this, 'StaticHeaders'),
      },
    };
  }
}

interface WebOriginRequestFnProps {
  readonly websiteHash: string;
  readonly primaryDomain?: string;
}

class WebOriginRequestFn extends cf.Function {
  constructor(scope: Construct, id: string, props: WebOriginRequestFnProps) {
    const code = webOriginRequestFnCode(props);

    super(scope, id, {
      functionName: renderName(scope, id),
      code: cf.FunctionCode.fromInline(code),
    });
  }
}

export function webOriginRequestFnCode(props: WebOriginRequestFnProps) {
  // language=javascript
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
      request.headers['x-website-hash'] = {value: props.websiteHash};

      return request;
    }
  `;
}

class StaticHeadersPolicy extends cf.ResponseHeadersPolicy {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Cache-Control',
            value: 'public,max-age=31536000,immutable',
            override: true,
          },
        ],
      },
    });
  }
}
