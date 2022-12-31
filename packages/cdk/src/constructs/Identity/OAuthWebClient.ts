import { Construct } from 'constructs';
import { aws_cognito } from 'aws-cdk-lib';
import { Identity } from './Identity';

export interface OAuthWebClientOptions {
  readonly callbackUrls: string[];
}

export interface OAuthWebClientProps extends OAuthWebClientOptions {
  readonly identity: Identity;
}

export class OAuthWebClient extends Construct {
  readonly clientId: string;
  readonly authorizeUrl: string;
  readonly tokenUrl: string;
  readonly userPool: aws_cognito.UserPool;
  readonly authority: string;

  private readonly client: aws_cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: OAuthWebClientProps) {
    super(scope, id);

    const { identity } = props;

    this.userPool = identity.userPool;

    this.client = new aws_cognito.UserPoolClient(this, 'Client', {
      userPool: identity.userPool,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: props.callbackUrls,
      },
    });

    this.clientId = this.client.userPoolClientId;
    this.authorizeUrl = `${props.identity.baseUrl}/oauth2/authorize`;
    this.tokenUrl = `${props.identity.baseUrl}/oauth2/token`;
    this.authority = this.userPool.userPoolProviderUrl;
  }
}
