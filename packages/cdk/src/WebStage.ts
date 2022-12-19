import {
  aws_certificatemanager,
  aws_route53,
  CfnOutput,
  Stack,
  Stage,
  StageProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SsrWebsite, SsrWebsiteCdn } from './SsrWebsite';

export interface WebStageProps extends StageProps {
  readonly domain?: DomainConfigProps;
}

/**
 * Responsible for creating website stacks and wiring up their constructs.
 *
 * ```
 *          ┌────────────────────────────┐
 *          │Content Distribution Network│
 *          │       <<cloudfront>>       │
 *          └──┬──────────────────────┬──┘
 *             │                      │
 *             │                      │
 *   ┌─────────┼──────────────────────┼─────────────┐
 *   │         │                      │             │
 *   │ ┌───────▼────────┐ ┌───────────▼───────────┐ │
 *   │ │ Next.js server │ │ Next.js Static Assets │ │
 *   │ │   <<lambda>>   │ │       <<bucket>>      │ │
 *   │ └────────────────┘ └───────────────────────┘ │
 *   │                                              │
 *   │                  Website                     │
 *   └──────────────────────────────────────────────┘
 *    Modify by copy/paste via https://asciiflow.com
 * ```
 */
export class WebStage extends Stage {
  constructor(scope: Construct, id: string, props: WebStageProps = {}) {
    super(scope, id, props);

    const stack = new Stack(this, 'Stack');

    const website = new SsrWebsite(stack, 'Website', {
      distDir: 'dist/packages/web',
    });

    const domainConfig =
      props.domain && new DomainConfig(stack, 'DomainNames', props.domain);

    const cdn = new SsrWebsiteCdn(stack, 'Cdn', {
      website,
      domainConfig: domainConfig && {
        domainNames: domainConfig.domainNames,
        certificate: domainConfig.certificate,
      },
    });

    if (domainConfig) {
      new DnsRecords(stack, 'DnsRecords', {
        domainNames: domainConfig.domainNames,
        zone: domainConfig.hostedZone,
        target: cdn.recordTarget,
      });
    }

    new CfnOutput(stack, 'Url', {
      value: `https://${cdn.cdnDomainName}/`,
    });
  }
}

export interface DomainConfigProps {
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly secondaryNames?: string[];
}

export class DomainConfig extends Construct {
  readonly domainName: string;
  readonly secondaryDomainNames: string[];
  readonly certificate: aws_certificatemanager.ICertificate;
  readonly domainNames: string[];
  readonly hostedZone: aws_route53.IHostedZone;

  constructor(scope: Construct, id: string, props: DomainConfigProps) {
    super(scope, id);

    this.domainName = props.domainName;
    this.secondaryDomainNames = props.secondaryNames ?? [];
    this.domainNames = [this.domainName, ...this.secondaryDomainNames];

    this.hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    this.certificate = new aws_certificatemanager.DnsValidatedCertificate(
      this,
      'Domain',
      {
        domainName: this.domainName,
        subjectAlternativeNames: this.secondaryDomainNames,
        hostedZone: this.hostedZone,
        region: 'us-east-1',
      },
    );
  }
}

export interface DomainRecordsProps {
  readonly zone: aws_route53.IHostedZone;
  readonly domainNames: string[];
  readonly target: aws_route53.RecordTarget;
}

export class DnsRecords extends Construct {
  constructor(scope: Construct, id: string, props: DomainRecordsProps) {
    super(scope, id);

    const { domainNames, zone, target } = props;

    for (const recordName of domainNames) {
      new aws_route53.ARecord(this, `A-${recordName}`, {
        recordName,
        zone,
        target,
        deleteExisting: true,
      });

      new aws_route53.AaaaRecord(this, `Aaaa-${recordName}`, {
        recordName,
        zone,
        target,
        deleteExisting: true,
      });
    }
  }
}
