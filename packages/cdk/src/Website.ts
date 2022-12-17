import { aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IOrigin } from 'aws-cdk-lib/aws-cloudfront';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';

interface WebsiteProps {
  readonly distDir: string;
}

export class Website extends Construct {
  readonly restApiOrigin: IOrigin;
  readonly assetsOrigin: IOrigin;

  constructor(scope: Construct, id: string, props: WebsiteProps) {
    super(scope, id);

    const distDir = props.distDir;

    const restApi = new LambdaRestApi(this, 'Api', {
      handler: new DockerImageFunction(this, 'Handler', {
        code: aws_lambda.DockerImageCode.fromImageAsset(distDir),
      }),
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
