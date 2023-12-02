import { NestedStack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Cors,
  LambdaIntegration, Method,
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
  public readonly methods: Method[] = [];

  constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string } & StackProps) {
    super(scope, 'product-service', props);

    const productsTable = Table.fromTableName(this, 'Products-table', PRODUCTS_TABLE_NAME);
    const stocksTable = Table.fromTableName(this, 'Stocks-table', STOCKS_TABLE_NAME);

    const api = RestApi.fromRestApiAttributes(this, 'products-rest-api', {
      restApiId: props.restApiId,
      rootResourceId: props.restApiRootResourceId,
    });

    const getProductsList = new NodejsFunction(this, 'get-products-list', {
      entry: 'services/product-service/lambdas/getProducts.ts',
      handler: 'handler',
      environment,
    });

    const getProductById = new NodejsFunction(this, 'get-products-by-id', {
      entry: 'services/product-service/lambdas/getProduct.ts',
      handler: 'handler',
      environment,
    });

    const createProduct = new NodejsFunction(this, 'create-product', {
      entry: 'services/product-service/lambdas/createProduct.ts',
      handler: 'handler',
      environment,
    });

    const productsRoute = api.root.addResource('products');
    const getProductByIdRoute = productsRoute.addResource('{id}');

    const productListIntegration = new LambdaIntegration(getProductsList);
    const productIntegration = new LambdaIntegration(getProductById);
    const createProductIntegration = new LambdaIntegration(createProduct);

    const getProductsListMethod = productsRoute.addMethod('GET', productListIntegration);
    const getProductByIdMethod = productsRoute.addMethod('POST', createProductIntegration);
    const createProductMethod = getProductByIdRoute.addMethod('GET', productIntegration);

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(createProduct);

    productsTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(getProductById);

    this.methods = [
      getProductsListMethod,
      getProductByIdMethod,
      createProductMethod,
    ]
  }
}
