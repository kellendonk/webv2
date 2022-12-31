import { DomainName, DomainNameBinding } from '../DomainName';
import { Construct } from 'constructs';
import { aws_cognito, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { OAuthWebClient, OAuthWebClientOptions } from './OAuthWebClient';

export interface IdentityProps {
  /**
   * The domain name to bind to the distribution
   * @default - use the default CloudFront domain name
   */
  readonly domainName?: DomainName;
}

/**
 * Responsible for creating the user pool and any login-related features.
 */
export class Identity extends Construct {
  readonly baseUrl: string;
  readonly userPool: aws_cognito.UserPool;

  constructor(scope: Construct, id: string, props: IdentityProps = {}) {
    super(scope, id);

    const stack = Stack.of(this);

    this.userPool = new aws_cognito.UserPool(this, 'Users', {
      userPoolName: stack.stackName,
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: {
        email: true,
        phone: true,
        username: true,
        preferredUsername: true,
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
        phoneNumber: { required: false, mutable: true },
        preferredUsername: { required: false, mutable: true },
      },
    });

    new aws_cognito.CfnUserPoolGroup(this, 'Admins', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admins',
    });

    const domainName = props.domainName;
    if (domainName) {
      domainName.bind(DomainNameBinding.cognito(this.userPool));
      this.baseUrl = `https://${domainName.domainName}/`;
    } else {
      const domain = this.userPool.addDomain('Domain', {
        cognitoDomain: {
          domainPrefix: `${stack.stackName.toLowerCase()}-x-${stack.account}`,
        },
      });

      this.baseUrl = domain.baseUrl();
    }
  }

  addWebClient(id: string, options: OAuthWebClientOptions) {
    return new OAuthWebClient(this, id, {
      identity: this,
      ...options,
    });
  }
}
