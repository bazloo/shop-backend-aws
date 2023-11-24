import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table, BillingMode } from "aws-cdk-lib/aws-dynamodb";

export class ProductService extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = Table.fromTableName(this, 'Products-table', 'Products'); // TODO refactor

    const stocksTable = new Table(this, 'DbTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const api = new RestApi(this, 'RestAPI', {
      restApiName: 'ProductServiceAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const getProductsList = new NodejsFunction(this, 'GetProductsList', {
      entry: 'resources/route-handlers/products.ts',
      handler: 'handler',
      environment: {
        PRODUCTS_TABLE_NAME: 'Products', // TODO refactor
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    const getProductById = new NodejsFunction(this, 'GetProductsById', {
      entry: 'resources/route-handlers/product.ts',
      handler: 'handler',
    });

    const productList = api.root.addResource('products');
    const productById = productList.addResource('{id}');

    const productListIntegration = new LambdaIntegration(getProductsList);
    const productIntegration = new LambdaIntegration(getProductById);

    productList.addMethod('GET', productListIntegration);
    productById.addMethod('GET', productIntegration);

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
  }
}
