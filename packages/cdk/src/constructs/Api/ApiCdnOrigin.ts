import { Construct } from 'constructs';
import { Api } from './Api';
import {
  aws_cloudfront as cf,
  aws_cloudfront_origins as cfo,
} from 'aws-cdk-lib';
import { renderName } from '../util';
import { ICdnOrigin } from '../Cdn';

export class ApiCdnOrigin extends Construct implements ICdnOrigin {
  readonly additionalBehaviors: Record<string, cf.BehaviorOptions>;

  constructor(scope: Construct, id: string, props: { api: Api }) {
    super(scope, id);

    const { api } = props;

    const apiOrigin = new cfo.HttpOrigin(api.apiDomain);

    this.additionalBehaviors = {
      '/graphql': {
        origin: apiOrigin,
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        cachePolicy: cf.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Allow CloudFront to send certain headers
        originRequestPolicy: new cf.OriginRequestPolicy(this, 'OriginRequest', {
          headerBehavior: cf.CacheHeaderBehavior.allowList(
            // User Auth
            'x-api-key',
            // 'authorization',
            // CORS
            'access-control-request-headers',
            'access-control-request-method',
            // For GraphQL posts
            'content-type',
          ),
        }),
        // Modify the viewer requests to add anonymous credentials where appropriate.
        functionAssociations: [
          {
            eventType: cf.FunctionEventType.VIEWER_REQUEST,
            function: new AddApiKeyFn(this, 'AddApiKeyFn', {
              apiKey: api.apiKey,
            }),
          },
        ],
      },
    };
  }
}

interface AddApiKeyFnProps {
  readonly apiKey: string;
}

class AddApiKeyFn extends cf.Function {
  constructor(scope: Construct, id: string, props: AddApiKeyFnProps) {
    // language=javascript
    const inlineCode = `
      var props = ${JSON.stringify(props)};

      function handler(event) {
        var request = event.request;
        var headers = request.headers;

        // When authorization isn't present, we add the api key.
        if (!headers['authorization']) {
          headers['x-api-key'] = {value: props.apiKey};
        }

        return request;
      }
    `;

    super(scope, id, {
      functionName: renderName(scope, id),
      code: cf.FunctionCode.fromInline(inlineCode),
    });
  }
}
