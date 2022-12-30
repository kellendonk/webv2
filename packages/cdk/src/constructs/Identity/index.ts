import { Construct } from 'constructs';
import { aws_cognito, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { DomainName, DomainNameBinding } from '../DomainName';

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

  constructor(scope: Construct, id: string, props: IdentityProps = {}) {
    super(scope, id);

    const stack = Stack.of(this);

    const userPool = new aws_cognito.UserPool(this, 'UserPool', {
      userPoolName: stack.stackName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const domainName = props.domainName;
    if (domainName) {
      domainName.bind(DomainNameBinding.cognito(userPool));
      this.baseUrl = `https://${domainName.domainName}/`;
    } else {
      const domain = userPool.addDomain('Domain', {
        cognitoDomain: {
          domainPrefix: `${stack.stackName.toLowerCase()}-${stack.account}`,
        },
      });

      this.baseUrl = domain.baseUrl();
    }
  }
}
