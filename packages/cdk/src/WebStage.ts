import { aws_lambda, Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

export class WebStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const stack = new Stack(this, 'Stack');

    // CDN -> Web -+-> Assets (Bucket)
    //             `-> Lambda

    new Cdn(stack, 'Cdn');

    new Web(stack, 'Web');
  }
}

class Cdn extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }
}

class Web extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new Bucket(this, 'Assets');

    const handler = new WebHandler(this, 'Handler');

    new LambdaRestApi(this, 'Api', {
      handler,
    });
  }
}

class WebHandler extends aws_lambda.DockerImageFunction {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: aws_lambda.DockerImageCode.fromImageAsset('dist/packages/web'),
    });
  }
}
