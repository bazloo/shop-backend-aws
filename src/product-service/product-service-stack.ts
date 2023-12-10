import { NestedStack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  LambdaIntegration, Method,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Topic, SubscriptionFilter } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

const PRODUCTS_TABLE_NAME = 'Products';
const STOCKS_TABLE_NAME = 'Stocks';

const environment = {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
};

export class ProductService extends NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string, queArn: string } & StackProps) {
    super(scope, 'product-service', props);

    const productsTable = Table.fromTableName(this, 'Products-table', PRODUCTS_TABLE_NAME);
    const stocksTable = Table.fromTableName(this, 'Stocks-table', STOCKS_TABLE_NAME);

    const api = RestApi.fromRestApiAttributes(this, 'products-rest-api', {
      restApiId: props.restApiId,
      rootResourceId: props.restApiRootResourceId,
    });

    const catalogItemsQueue = sqs.Queue.fromQueueArn(this, 'catalog-items-queue', props.queArn);

    const createProductTopic = new Topic(this, 'create-product-topic');

    createProductTopic.addSubscription(new EmailSubscription(process.env.REGULAR_PRICE_EMAIL_NOTIFICATION!,
      {
        filterPolicy: {
          price: SubscriptionFilter.stringFilter({
            allowlist: ['regular-price'],
          })
        },
      }));

    // Additional subscription with second email,
    // for notification when list of products contains product with price 100$ or greater.
    createProductTopic.addSubscription(new EmailSubscription(process.env.EXTRA_PRICE_EMAIL_NOTIFICATION!, {
      filterPolicy: {
        price: SubscriptionFilter.stringFilter({
          allowlist: ['extra-price'],
        })
      },
    }));

    const getProductsList = new NodejsFunction(this, 'get-products-list', {
      entry: 'src/product-service/lambdas/getProducts.ts',
      handler: 'handler',
      environment,
    });

    const getProductById = new NodejsFunction(this, 'get-products-by-id', {
      entry: 'src/product-service/lambdas/getProduct.ts',
      handler: 'handler',
      environment,
    });

    const createProduct = new NodejsFunction(this, 'create-product', {
      entry: 'src/product-service/lambdas/createProduct.ts',
      handler: 'handler',
      environment,
    });

    const catalogBatchProcess = new NodejsFunction(this, 'catalog-batch-process', {
      entry: 'src/product-service/lambdas/catalogBatchProcess.ts',
      handler: 'handler',
      environment: {
        ...environment,
        QUEUE_URL: catalogItemsQueue.queueUrl,
        TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    catalogBatchProcess.addEventSource(
        new SqsEventSource(catalogItemsQueue, {
          batchSize: 5,
        }),
    );

    const productsRoute = api.root.addResource('products');
    const getProductByIdRoute = productsRoute.addResource('{id}');

    const productListIntegration = new LambdaIntegration(getProductsList);
    const productIntegration = new LambdaIntegration(getProductById);
    const createProductIntegration = new LambdaIntegration(createProduct);

    const getProductsListMethod = productsRoute.addMethod('GET', productListIntegration);
    const getProductByIdMethod = productsRoute.addMethod('POST', createProductIntegration);
    const createProductMethod = getProductByIdRoute.addMethod('GET', productIntegration);

    createProductTopic.grantPublish(catalogBatchProcess);

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);

    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(createProduct);

    productsTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(getProductById);

    productsTable.grantReadWriteData(catalogBatchProcess);
    stocksTable.grantReadWriteData(catalogBatchProcess);

    this.methods = [
      getProductsListMethod,
      getProductByIdMethod,
      createProductMethod,
    ]
  }
}
