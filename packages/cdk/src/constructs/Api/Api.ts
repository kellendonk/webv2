import { Construct } from 'constructs';
import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_cognito,
  aws_dynamodb,
  aws_logs,
  Duration,
  Expiration,
  Fn,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';
import { readFileSync } from 'fs';

export interface ApiProps {
  /**
   * Use an externally owned database table.
   * @default - Creates its own
   */
  readonly table?: ApiTable;

  /**
   * Provide info about this OAuth client so the public can authenticate and
   * check the tokens issued against the given identity provider.
   */
  readonly webClientConfig: WebClientConfig;
}

export interface WebClientConfig {
  readonly userPool: aws_cognito.IUserPool;
  readonly authority: string;
  readonly clientId: string;
}

/**
 * Responsible for creating the GraphQL API.
 */
export class Api extends Construct {
  readonly origin: aws_cloudfront.IOrigin;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { webClientConfig, table } = props;

    const apiTable =
      table ??
      new ApiTable(this, 'Table', {
        removalPolicy: RemovalPolicy.DESTROY,
      });

    const api = new aws_appsync.GraphqlApi(this, 'Api', {
      name: Stack.of(this).stackName,
      schema: aws_appsync.SchemaFile.fromAsset(
        join(__dirname, 'schema.graphql'),
      ),

      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: aws_appsync.FieldLogLevel.ALL,
        retention: aws_logs.RetentionDays.ONE_MONTH,
      },

      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: aws_appsync.AuthorizationType.IAM,
        },
        additionalAuthorizationModes: [
          {
            authorizationType: aws_appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: toStableExpiration(Expiration.after(Duration.days(365))),
            },
          },
          {
            authorizationType: aws_appsync.AuthorizationType.USER_POOL,
            userPoolConfig: {
              userPool: webClientConfig.userPool,
              defaultAction: aws_appsync.UserPoolDefaultAction.DENY,
            },
          },
        ],
      },
    });

    const tableDataSource = api.addDynamoDbDataSource('Table', apiTable);
    const noneDataSource = api.addNoneDataSource('None');

    api.createResolver('Query.getInteractions', {
      dataSource: tableDataSource,
      typeName: 'Query',
      fieldName: 'getInteractions',
      requestMappingTemplate: vtl('Query.getInteractions.vm'),
      responseMappingTemplate: vtl('Query.getInteractions.response.vm'),
    });

    api.createResolver('Mutation.addInteraction', {
      dataSource: tableDataSource,
      typeName: 'Mutation',
      fieldName: 'addInteraction',
      requestMappingTemplate: vtl('Mutation.addInteraction.vm', {
        $tableName: apiTable.tableName,
      }),
      responseMappingTemplate: vtl('Mutation.addInteraction.response.vm'),
    });

    api.createResolver('Query.authInfo', {
      dataSource: noneDataSource,
      typeName: 'Query',
      fieldName: 'authInfo',
      requestMappingTemplate: vtl('Query.authInfo.vm'),
      responseMappingTemplate: vtl('Query.authInfo.response.vm', {
        $authority: webClientConfig.authority,
        $clientId: webClientConfig.clientId,
      }),
    });

    // Determine the api domain from the resource's GraphQLUrl attribute.
    // There's no correlation between the API ID and the URL, so we need to do
    // some string manipulation on a url that looks like this:
    // https://z6lexrwz2vcyhmi5q7yshcgd5i.appsync-api.ca-central-1.amazonaws.com/graphql
    const apiDomain = Fn.select(2, Fn.split('/', api.graphqlUrl));

    this.origin = new aws_cloudfront_origins.HttpOrigin(apiDomain, {
      customHeaders: {
        'x-api-key': api.apiKey,
      },
    });
  }
}

/**
 * DynamoDB table for the API. It's a single table design, so it should work
 * for most use cases.
 */
export class ApiTable extends aws_dynamodb.Table {
  constructor(
    scope: Construct,
    id: string,
    props: Partial<aws_dynamodb.TableProps> = {},
  ) {
    super(scope, id, {
      partitionKey: {
        name: 'PK',
        type: aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: aws_dynamodb.AttributeType.STRING,
      },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      ...props,
    });
  }
}

/**
 * Create a mapping template from a vtl template file.
 */
function vtl(
  subPath: string,
  replacements: Record<string, string> = {},
): aws_appsync.MappingTemplate {
  const fileName = join(__dirname, 'vtl', subPath);

  const initialValue = readFileSync(fileName, 'utf8');

  const template = Object.entries(replacements).reduce(
    (str, [match, replace]) => str.replaceAll(match, replace),
    initialValue,
  );

  return aws_appsync.MappingTemplate.fromString(template);
}

/**
 * Stabilizes an expiration, so it doesn't change as often.
 */
function toStableExpiration(expiration: Expiration): Expiration {
  const target = expiration.date.getTime();
  const thirtyDays = Duration.days(30).toMilliseconds();
  const number = Math.floor(target / thirtyDays) * thirtyDays;
  return Expiration.atTimestamp(number);
}
