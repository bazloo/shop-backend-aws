import { NestedStack, StackProps } from 'aws-cdk-lib';
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

export class ProductService extends NestedStack {
  constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string } & StackProps) {
    super(scope, 'ProductService', props);

    const productsTable = Table.fromTableName(this, 'Products-table', PRODUCTS_TABLE_NAME);
    const stocksTable = Table.fromTableName(this, 'Stocks-table', STOCKS_TABLE_NAME);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.restApiRootResourceId,
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

    const productsRoute = api.root.addResource('products');
    const getProductByIdRoute = productsRoute.addResource('{id}');

    const productListIntegration = new LambdaIntegration(getProductsList);
    const productIntegration = new LambdaIntegration(getProductById);
    const createProductIntegration = new LambdaIntegration(createProduct);

    productsRoute.addMethod('GET', productListIntegration);
    productsRoute.addMethod('POST', createProductIntegration);
    getProductByIdRoute.addMethod('GET', productIntegration);

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(createProduct);

    productsTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(getProductById);
  }
}
