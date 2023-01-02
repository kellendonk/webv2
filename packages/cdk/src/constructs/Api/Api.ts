import { Construct } from 'constructs';
import {
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
import { ISchemaConfig } from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { glob } from 'glob';
import { toStableExpiration } from '../util';
import { buildSchema } from 'graphql/utilities';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

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
  readonly apiKey: string;
  readonly apiDomain: string;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { webClientConfig, table } = props;

    const apiTable =
      table ??
      new ApiTable(this, 'Table', {
        removalPolicy: RemovalPolicy.DESTROY,
      });

    const schema = mergeSchemaDir(join(__dirname, 'schema'));

    const api = new aws_appsync.GraphqlApi(this, 'Api', {
      name: Stack.of(this).stackName,
      schema: {
        bind(api: aws_appsync.IGraphqlApi): ISchemaConfig {
          return {
            apiId: api.apiId,
            definition: schema,
          };
        },
      },

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

    // Auth info

    api.createResolver('Query.authInfo', {
      dataSource: noneDataSource,
      typeName: 'Query',
      fieldName: 'authInfo',
      requestMappingTemplate: vtl('auth/Query.authInfo.vm'),
      responseMappingTemplate: vtl('auth/Query.authInfo.response.vm', {
        $authority: webClientConfig.authority,
        $clientId: webClientConfig.clientId,
      }),
    });

    // Interactions

    api.createResolver('Query.getInteractions', {
      dataSource: tableDataSource,
      typeName: 'Query',
      fieldName: 'getInteractions',
      requestMappingTemplate: vtl('interactions/Query.getInteractions.vm'),
      responseMappingTemplate: vtl(
        'interactions/Query.getInteractions.response.vm',
      ),
    });

    api.createResolver('Mutation.addInteraction', {
      dataSource: tableDataSource,
      typeName: 'Mutation',
      fieldName: 'addInteraction',
      requestMappingTemplate: vtl('interactions/Mutation.addInteraction.vm', {
        $tableName: apiTable.tableName,
      }),
      responseMappingTemplate: vtl(
        'interactions/Mutation.addInteraction.response.vm',
      ),
    });

    // Guest book

    api.createResolver('Mutation.addGuestBookSignature', {
      dataSource: tableDataSource,
      typeName: 'Mutation',
      fieldName: 'addGuestBookSignature',
      requestMappingTemplate: vtl(
        'guest-book/Mutation.addGuestBookSignature.vm',
        {
          $tableName: apiTable.tableName,
        },
      ),
      responseMappingTemplate: vtl(
        'guest-book/Mutation.addGuestBookSignature.response.vm',
      ),
    });

    api.createResolver('Query.getGuestBookSignatures', {
      dataSource: tableDataSource,
      typeName: 'Query',
      fieldName: 'getGuestBookSignatures',
      requestMappingTemplate: vtl('guest-book/Query.getGuestBookSignatures.vm'),
      responseMappingTemplate: vtl(
        'guest-book/Query.getGuestBookSignatures.response.vm',
      ),
    });

    // Determine the api domain from the resource's GraphQLUrl attribute.
    // There's no correlation between the API ID and the URL, so we need to do
    // some string manipulation on a url that looks like this:
    // https://z6lexrwz2vcyhmi5q7yshcgd5i.appsync-api.ca-central-1.amazonaws.com/graphql
    const apiDomain = Fn.select(2, Fn.split('/', api.graphqlUrl));

    this.apiKey = api.apiKey;
    this.apiDomain = apiDomain;
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

function mergeSchemaDir(schemaDir: string) {
  const schemaFileList = glob.sync('**/*.graphql', { cwd: schemaDir });
  const schemaSources = schemaFileList
    .map((m) => fs.readFileSync(join(schemaDir, m), 'utf-8'))
    .join('\n');

  const schema = buildSchema(schemaSources);
  return printSchemaWithDirectives(schema);
}
