import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from "aws-cdk-lib/aws-dynamodb";

export class ProductService extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = Table.fromTableName(this, 'Products-table', 'Products'); // TODO refactor
    const stocksTable = Table.fromTableName(this, 'Stocks-table', 'Stocks');

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
        STOCKS_TABLE_NAME: 'Stocks',
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
