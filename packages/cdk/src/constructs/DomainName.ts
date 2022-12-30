import {
  aws_certificatemanager,
  aws_cloudfront,
  aws_cognito,
  aws_route53,
  aws_route53_targets,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Responsible for producing certificates and records for a given domain name.
 */
export class DomainName extends Construct {
  /** The primary domain name */
  readonly domainName: string;

  /** Alternative names */
  readonly subjectAlternativeNames: string[];

  /** All registered domain names */
  readonly domainNames: string[];

  /** The hosted zone to create all records in */
  readonly hostedZone: aws_route53.IHostedZone;

  /** To prevent more than one binding of domain to resource */
  private bound = false;

  constructor(scope: Construct, id: string, props: DomainNameProps) {
    super(scope, id);

    this.domainName = props.domainName;
    this.subjectAlternativeNames = props.subjectAlternativeNames ?? [];
    this.domainNames = [props.domainName, ...this.subjectAlternativeNames];

    this.hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    if (props.target) {
      this.bind(props.target);
    }
  }

  bind(binding: DomainNameBinding) {
    if (this.bound) {
      throw new Error(
        'Cannot register more than one target for this domain name',
      );
    }

    binding.bind(this);
    this.bound = true;
  }
}

export interface DomainNameProps extends DomainNameOptions {
  readonly certificateRegion?: string;
  readonly target?: DomainNameBinding;
}

export interface DomainNameOptions {
  readonly domainName: string;
  readonly subjectAlternativeNames?: string[];
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
}

/**
 * Responsible for binding domain name to another resource.
 */
export abstract class DomainNameBinding {
  /** Create a binding to a CloudFront distribution */
  static cloudFront(
    distribution: aws_cloudfront.Distribution,
  ): DomainNameBinding {
    return new CloudFrontBinding(distribution);
  }

  static cognito(userPool: aws_cognito.UserPool): DomainNameBinding {
    return new CognitoBinding(userPool);
  }

  abstract bind(domainName: DomainName);
}

class CloudFrontBinding extends DomainNameBinding {
  constructor(private readonly distribution: aws_cloudfront.Distribution) {
    super();
  }

  bind(domainName: DomainName) {
    const cfnDistribution = this.distribution.node.defaultChild;
    if (!(cfnDistribution instanceof aws_cloudfront.CfnDistribution)) {
      throw new Error('Distribution default child is not a CfnDistribution');
    }

    const certificate = new aws_certificatemanager.DnsValidatedCertificate(
      this.distribution,
      'Certificate',
      {
        domainName: domainName.domainName,
        subjectAlternativeNames: domainName.subjectAlternativeNames,
        hostedZone: domainName.hostedZone,
        region: 'us-east-1',
      },
    );

    // Patch the distribution.
    cfnDistribution.distributionConfig = {
      ...cfnDistribution.distributionConfig,
      aliases: domainName.domainNames,
      viewerCertificate: {
        acmCertificateArn: certificate.certificateArn,
        sslSupportMethod: aws_cloudfront.SSLMethod.SNI,
        minimumProtocolVersion:
          aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      },
    };

    for (const recordName of domainName.domainNames) {
      const recordProps = {
        recordName,
        zone: domainName.hostedZone,
        target: aws_route53.RecordTarget.fromAlias(
          new aws_route53_targets.CloudFrontTarget(this.distribution),
        ),
        deleteExisting: true,
      };

      const aRecord = new aws_route53.ARecord(
        domainName,
        `A-${recordName}`,
        recordProps,
      );
      const aaaaRecord = new aws_route53.AaaaRecord(
        domainName,
        `Aaaa-${recordName}`,
        recordProps,
      );

      // Ensure deleteExisting happens only after distribution changes
      aRecord.node.addDependency(this.distribution);
      aaaaRecord.node.addDependency(this.distribution);
    }
  }
}

class CognitoBinding extends DomainNameBinding {
  constructor(private readonly userPool: aws_cognito.UserPool) {
    super();
  }

  bind(domainName: DomainName) {
    const certificate = new aws_certificatemanager.DnsValidatedCertificate(
      this.userPool,
      'Certificate',
      {
        domainName: domainName.domainName,
        subjectAlternativeNames: domainName.subjectAlternativeNames,
        hostedZone: domainName.hostedZone,
        region: 'us-east-1',
      },
    );

    const userPoolDomain = this.userPool.addDomain('Domain', {
      customDomain: {
        domainName: domainName.domainName,
        certificate,
      },
    });

    new aws_route53.CnameRecord(domainName, `Cname-${domainName.domainName}`, {
      domainName: userPoolDomain.cloudFrontDomainName,
      zone: domainName.hostedZone,
    });
  }
}
