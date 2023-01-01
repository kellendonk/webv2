import { Construct } from 'constructs';
import { aws_cloudfront as cf } from 'aws-cdk-lib';
import { DomainName, DomainNameBinding } from '../DomainName';

export interface CdnProps {
  /**
   * The default origin
   */
  readonly defaultOrigin: IDefaultCdnOrigin;

  /**
   * An ordered list of cdn origins. Earlier origin behaviors take precedence.
   */
  readonly additionalOrigins: ICdnOrigin[];

  /**
   * The domain name to bind to the distribution
   * @default - use the default CloudFront domain name
   */
  readonly domainName?: DomainName;
}

export interface IDefaultCdnOrigin extends ICdnOrigin {
  readonly defaultBehavior: cf.BehaviorOptions;
}

export interface ICdnOrigin {
  readonly additionalBehaviors: Record<string, cf.BehaviorOptions>;
}

/**
 * Responsible for creating the CDN distribution.
 */
export class Cdn extends Construct {
  readonly domainName: string;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    const { domainName, defaultOrigin, additionalOrigins } = props;

    const allOrigins = [defaultOrigin, ...additionalOrigins];

    // Combine additional behaviors from all origins
    const additionalBehaviors = allOrigins.reduce(
      (previous, currentValue) => ({
        ...previous,
        // Behaviors added earlier take precedence.
        ...currentValue.additionalBehaviors,
      }),
      {},
    );

    const distribution = new cf.Distribution(this, 'Distribution', {
      defaultBehavior: defaultOrigin.defaultBehavior,
      additionalBehaviors: additionalBehaviors,

      // Miscellaneous configs
      enableIpv6: true,
      enableLogging: true,
      httpVersion: cf.HttpVersion.HTTP2_AND_3,
      priceClass: cf.PriceClass.PRICE_CLASS_100,
    });

    domainName?.bind(DomainNameBinding.cloudFront(distribution));

    this.domainName =
      domainName?.domainName ?? distribution.distributionDomainName;
  }
}
