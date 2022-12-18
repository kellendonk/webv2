import {
  AssetStaging,
  aws_cloudfront,
  aws_lambda,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  Distribution,
  FunctionEventType,
  IOrigin,
  PriceClass,
} from 'aws-cdk-lib/aws-cloudfront';
import { LambdaRestApi, MethodLoggingLevel } from 'aws-cdk-lib/aws-apigateway';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs';
import * as path from 'path';
import { LambdaBlowtorch } from '@wheatstalk/cdk-lambda-blowtorch';

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
  /**
   * The REST API origin where the lambda handlers reside.
   */
  readonly restApiOrigin: IOrigin;

  /**
   * The assets origin where all static assets live.
   */
  readonly assetsOrigin: IOrigin;

  /**
   * The hash of the asset backing the deployed website. You can use this as a
   * cache key.
   */
  readonly hash: string;

  constructor(scope: Construct, id: string, props: SsrWebsiteProps) {
    super(scope, id);

    const distDir = props.distDir;

    const stagedDistAsset = new AssetStaging(this, 'StagedDistAsset', {
      sourcePath: distDir,
    });

    this.hash = stagedDistAsset.assetHash;

    const handler = new DockerImageFunction(this, 'Handler', {
      code: DockerImageCode.fromImageAsset(distDir),
      tracing: aws_lambda.Tracing.ACTIVE,
    });

    new LambdaBlowtorch(this, 'HandlerWarming', {
      target: handler,
      desiredConcurrency: 3,
      warmingInterval: Duration.minutes(1),
      warmingPayload: JSON.stringify(API_GATEWAY_REQUEST),
    });

    const restApi = new LambdaRestApi(this, 'Api', {
      handler,
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    const assets = new Bucket(this, 'Assets');

    // Deploy the static assets to the bucket. Note: We don't prune here. This
    // is so that users currently on the site don't fail when they try to load
    // static assets such as page js files.
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

    const cachePolicy = new CachePolicy(this, 'SSRCachePolicy', {
      minTtl: Duration.seconds(1),
      maxTtl: Duration.days(30),
      defaultTtl: Duration.days(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: CacheHeaderBehavior.allowList('X-Website-Hash'),
      cookieBehavior: CacheCookieBehavior.none(),
    });

    const code = fs.readFileSync(
      path.join(__dirname, 'SsrWebsite.ViewerRequest.js'),
      'utf8',
    );

    const viewerRequest = new aws_cloudfront.Function(this, 'ViewerRequest', {
      functionName: [...this.node.path.split('/'), 'ViewerRequest'].join('-'),
      code: aws_cloudfront.FunctionCode.fromInline(
        scriptSub(code, {
          WEBSITE_HASH: website.hash,
        }),
      ),
    });

    const distribution = new Distribution(this, 'Distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      enableLogging: true,
      defaultBehavior: {
        origin: website.restApiOrigin,
        cachePolicy,
        functionAssociations: [
          {
            eventType: FunctionEventType.VIEWER_REQUEST,
            function: viewerRequest,
          },
        ],
      },
      additionalBehaviors: {
        '/_next/static/*': { origin: website.assetsOrigin },
      },
    });

    this.domainName = distribution.distributionDomainName;
  }
}

export function scriptSub(
  script: string,
  props: Record<string, string>,
): string {
  return Object.entries(props).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
    script,
  );
}

const API_GATEWAY_REQUEST = {
  resource: '/',
  path: '/',
  httpMethod: 'GET',
  headers: {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    cookie: 's_fid=7AAB6XMPLAFD9BBF-0643XMPL09956DE2; regStatus=pre-register',
    Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'upgrade-insecure-requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
    'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
    'X-Forwarded-For': '52.255.255.12',
    'X-Forwarded-Port': '443',
    'X-Forwarded-Proto': 'https',
  },
  multiValueHeaders: {
    accept: [
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    ],
    'accept-encoding': ['gzip, deflate, br'],
    'accept-language': ['en-US,en;q=0.9'],
    cookie: [
      's_fid=7AABXMPL1AFD9BBF-0643XMPL09956DE2; regStatus=pre-register;',
    ],
    Host: ['70ixmpl4fl.execute-api.ca-central-1.amazonaws.com'],
    'sec-fetch-dest': ['document'],
    'sec-fetch-mode': ['navigate'],
    'sec-fetch-site': ['none'],
    'upgrade-insecure-requests': ['1'],
    'User-Agent': [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
    ],
    'X-Amzn-Trace-Id': ['Root=1-5e66d96f-7491f09xmpl79d18acf3d050'],
    'X-Forwarded-For': ['52.255.255.12'],
    'X-Forwarded-Port': ['443'],
    'X-Forwarded-Proto': ['https'],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    resourceId: '2gxmpl',
    resourcePath: '/',
    httpMethod: 'GET',
    extendedRequestId: 'JJbxmplHYosFVYQ=',
    requestTime: '10/Mar/2020:00:03:59 +0000',
    path: '/Prod/',
    accountId: '123456789012',
    protocol: 'HTTP/1.1',
    stage: 'Prod',
    domainPrefix: '70ixmpl4fl',
    requestTimeEpoch: 1583798639428,
    requestId: '77375676-xmpl-4b79-853a-f982474efe18',
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: '52.255.255.12',
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
      user: null,
    },
    domainName: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
    apiId: '70ixmpl4fl',
  },
  body: null,
  isBase64Encoded: false,
};
