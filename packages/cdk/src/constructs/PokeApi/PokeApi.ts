import { Construct } from 'constructs';
import { aws_dynamodb, aws_logs, RemovalPolicy } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { FieldLogLevel } from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';

export interface PokeApiProps {
  readonly table?: PokeDataTable;
}

export class PokeApi extends Construct {
  constructor(scope: Construct, id: string, props: PokeApiProps = {}) {
    super(scope, id);

    const table =
      props.table ??
      new PokeDataTable(this, 'Table', {
        removalPolicy: RemovalPolicy.DESTROY,
      });

    const api = new aws_appsync.GraphqlApi(this, 'Graphql', {
      name: 'PokeApi',
      schema: aws_appsync.SchemaFile.fromAsset(
        join(__dirname, 'PokeApi.graphql'),
      ),

      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
        retention: aws_logs.RetentionDays.ONE_MONTH,
      },
      authorizationConfig: {},
    });

    const tableDataSource = api.addDynamoDbDataSource('Table', table);

    api.createResolver('Query-getInteractions', {
      dataSource: tableDataSource,
      typeName: 'Query',
      fieldName: 'getInteractions',
      requestMappingTemplate: vtl('Query.getInteractions.vm'),
      responseMappingTemplate: vtl('Query.getInteractions.response.vm'),
    });

    // new aws_appsync.Resolver(this, 'Mutation-addInteraction', {
    //   api,
    //   typeName: 'Mutation',
    //   fieldName: 'addInteraction',
    //   requestMappingTemplate: vtl('Mutation.addInteraction.vm'),
    //   responseMappingTemplate: vtl('Mutation.addInteraction.response.vm'),
    // });

    api.createResolver('Mutation-addInteraction', {
      dataSource: tableDataSource,
      typeName: 'Mutation',
      fieldName: 'addInteraction',
      requestMappingTemplate: vtl('Mutation.addInteraction.vm'),
      responseMappingTemplate: vtl('Mutation.addInteraction.response.vm'),
    });
  }
}

export class PokeDataTable extends aws_dynamodb.Table {
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
