import { aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Distribution, IOrigin, PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import { LambdaRestApi, MethodLoggingLevel } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';

export interface SsrWebsiteProps {
  /**
   * The directory containing the build output for the Next.js application.
   * We expect a Dockerfile in the directory, so we can build a container.
   */
  readonly distDir: string;
}

/**
 * Responsible for creating the hosting for a nextjs site.
 */
export class SsrWebsite extends Construct {
  readonly restApiOrigin: IOrigin;
  readonly assetsOrigin: IOrigin;

  constructor(scope: Construct, id: string, props: SsrWebsiteProps) {
    super(scope, id);

    const distDir = props.distDir;

    const restApi = new LambdaRestApi(this, 'Api', {
      handler: new DockerImageFunction(this, 'Handler', {
        code: DockerImageCode.fromImageAsset(distDir),
        tracing: aws_lambda.Tracing.ACTIVE,
      }),
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    const assets = new Bucket(this, 'Assets');

    new BucketDeployment(this, 'DeployStaticAssets', {
      destinationBucket: assets,
      destinationKeyPrefix: '_next/static',
      sources: [Source.asset(`${distDir}/.next/static`)],
    });

    this.assetsOrigin = new S3Origin(assets);
    this.restApiOrigin = new RestApiOrigin(restApi);
  }
}

export interface SsrWebsiteCdnProps {
  readonly website: SsrWebsite;
}

export class SsrWebsiteCdn extends Construct {
  readonly domainName: string;

  constructor(scope: Construct, id: string, props: SsrWebsiteCdnProps) {
    super(scope, id);

    const { website } = props;

    const distribution = new Distribution(this, 'Distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      enableLogging: true,
      defaultBehavior: {
        origin: website.restApiOrigin,
      },
      additionalBehaviors: {
        '/_next/static/*': { origin: website.assetsOrigin },
      },
    });

    this.domainName = distribution.distributionDomainName;
  }
}
