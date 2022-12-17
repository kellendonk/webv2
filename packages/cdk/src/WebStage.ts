import { aws_lambda, CfnOutput, Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Distribution, IOrigin, PriceClass } from "aws-cdk-lib/aws-cloudfront";
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BehaviorOptions } from 'aws-cdk-lib/aws-cloudfront/lib/distribution';

export class WebStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const stack = new Stack(this, 'Stack');

    // CDN -> Website Behaviors -+-> Website.assetsBucket
    //                           `-> Website.restApi

    const website = new Website(stack, 'Website');

    const cdn = new Cdn(stack, 'Cdn', {
      defaultOrigin: website.restApiOrigin,
      additionalBehaviors: {
        '_next/static': {
          origin: website.assetsOrigin,
        },
      },
    });

    new CfnOutput(stack, 'CdnDomainName', {
      value: `https://${cdn.domainName}/`,
    });
  }
}

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

export class Website extends Construct {
  readonly restApiOrigin: IOrigin;
  readonly assetsOrigin: IOrigin;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const handler = new WebHandler(this, 'Handler');

    const restApi = new LambdaRestApi(this, 'Api', {
      handler,
    });

    const assets = new Bucket(this, 'Assets');

    new BucketDeployment(this, 'DeployStaticAssets', {
      destinationBucket: assets,
      destinationKeyPrefix: '_next/static',
      sources: [Source.asset('dist/packages/web/.next/static')],
    });

    this.assetsOrigin = new S3Origin(assets);
    this.restApiOrigin = new RestApiOrigin(restApi);
  }
}

class WebHandler extends aws_lambda.DockerImageFunction {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: aws_lambda.DockerImageCode.fromImageAsset('dist/packages/web'),
    });
  }
}
