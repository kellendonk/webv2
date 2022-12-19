import { Construct } from 'constructs';
import { aws_route53 } from 'aws-cdk-lib';
import { RecordTarget } from 'aws-cdk-lib/aws-route53';

export interface DomainConfigProps {
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly secondaryNames?: string[];
}

export class DomainConfig extends Construct {
  readonly domainName: string;
  readonly secondaryDomainNames: string[];

  readonly allDomainNames: string[];
  readonly hostedZone: aws_route53.IHostedZone;

  constructor(scope: Construct, id: string, props: DomainConfigProps) {
    super(scope, id);

    this.domainName = props.domainName;
    this.secondaryDomainNames = props.secondaryNames ?? [];
    this.allDomainNames = [this.domainName, ...this.secondaryDomainNames];

    this.hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );
  }

  createDnsRecords(stack: Construct, id: string, target: RecordTarget) {
    new NameRecords(stack, 'DnsRecords', {
      domainNames: this.allDomainNames,
      zone: this.hostedZone,
      target,
    });
  }
}

interface NameRecordsConfig {
  readonly zone: aws_route53.IHostedZone;
  readonly domainNames: string[];
  readonly target: aws_route53.RecordTarget;
}

/**
 * Responsible for creating DNS records for all the given domain names.
 */
class NameRecords extends Construct {
  constructor(scope: Construct, id: string, props: NameRecordsConfig) {
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
