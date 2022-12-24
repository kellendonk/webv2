import { Construct } from 'constructs';
import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_dynamodb,
  aws_logs,
  Fn,
  RemovalPolicy,
} from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';

export interface ApiProps {
  readonly table?: ApiTable;
}

export class Api extends Construct {
  readonly origin: aws_cloudfront.IOrigin;

  constructor(scope: Construct, id: string, props: ApiProps = {}) {
    super(scope, id);

    const table =
      props.table ??
      new ApiTable(this, 'Table', {
        removalPolicy: RemovalPolicy.DESTROY,
      });

    const api = new aws_appsync.GraphqlApi(this, 'Graphql', {
      name: 'KellendonkApi',
      schema: aws_appsync.SchemaFile.fromAsset(
        join(__dirname, 'schema.graphql'),
      ),

      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: aws_appsync.FieldLogLevel.ALL,
        retention: aws_logs.RetentionDays.ONE_MONTH,
      },
    });

    const tableDataSource = api.addDynamoDbDataSource('Table', table);

    api.createResolver('Query-getInteractions', {
      dataSource: tableDataSource,
      typeName: 'Query',
      fieldName: 'getInteractions',
      requestMappingTemplate: vtl('Query.getInteractions.vm'),
      responseMappingTemplate: vtl('Query.getInteractions.response.vm'),
    });

    api.createResolver('Mutation-addInteraction', {
      dataSource: tableDataSource,
      typeName: 'Mutation',
      fieldName: 'addInteraction',
      requestMappingTemplate: vtl('Mutation.addInteraction.vm'),
      responseMappingTemplate: vtl('Mutation.addInteraction.response.vm'),
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
      ...props,
    });
  }
}

function vtl(paths: string) {
  return aws_appsync.MappingTemplate.fromFile(join(__dirname, 'vtl', paths));
}
