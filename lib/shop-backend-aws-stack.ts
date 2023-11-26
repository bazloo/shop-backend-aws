import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from "aws-cdk-lib/aws-dynamodb";

const PRODUCTS_TABLE_NAME = 'Products';
const STOCKS_TABLE_NAME = 'Stocks';

const environment = {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
};

export class ProductService extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = Table.fromTableName(this, 'Products-table', PRODUCTS_TABLE_NAME);
    const stocksTable = Table.fromTableName(this, 'Stocks-table', STOCKS_TABLE_NAME);

    const api = new RestApi(this, 'RestAPI', {
      restApiName: 'ProductServiceAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const getProductsList = new NodejsFunction(this, 'GetProductsList', {
      entry: 'resources/route-handlers/getProducts.ts',
      handler: 'handler',
      environment,
    });

    const getProductById = new NodejsFunction(this, 'GetProductsById', {
      entry: 'resources/route-handlers/getProduct.ts',
      handler: 'handler',
      environment,
    });

    const createProduct = new NodejsFunction(this, 'CreateProduct', {
      entry: 'resources/route-handlers/createProduct.ts',
      handler: 'handler',
      environment,
    });

    const products = api.root.addResource('products');
    const productById = products.addResource('{id}');

    const productListIntegration = new LambdaIntegration(getProductsList);
    const productIntegration = new LambdaIntegration(getProductById);
    const createProductIntegration = new LambdaIntegration(createProduct);

    products.addMethod('GET', productListIntegration);
    products.addMethod('POST', createProductIntegration);
    productById.addMethod('GET', productIntegration);

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(createProduct);

    productsTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(getProductById);
  }
}
