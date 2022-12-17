import { Construct } from 'constructs';
import { Distribution, IOrigin, PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import { BehaviorOptions } from 'aws-cdk-lib/aws-cloudfront/lib/distribution';

export interface CdnProps {
  readonly defaultOrigin: IOrigin;
  readonly additionalBehaviors?: Record<string, BehaviorOptions>;
}

export class Cdn extends Construct {
  readonly domainName: string;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    const distribution = new Distribution(this, 'Distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      defaultBehavior: {
        origin: props.defaultOrigin,
      },
      additionalBehaviors: props.additionalBehaviors,
    });

    this.domainName = distribution.distributionDomainName;
  }
}
