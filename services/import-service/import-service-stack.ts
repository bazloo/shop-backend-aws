import { NestedStack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Cors,
    LambdaIntegration,
    RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class ImportService extends NestedStack {
    constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string } & StackProps) {
        super(scope, 'ProductService', props);

        const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId,
        });

        const importProductsFile = new NodejsFunction(this, 'GetProductsList', {
            entry: '',
            handler: 'handler',
        });

        const importFileParser = new NodejsFunction(this, 'GetProductsById', {
            entry: 'resources/route-handlers/getProduct.ts',
            handler: 'handler',
        });

        const importRoute = api.root.addResource('import');

        const importIntegration = new LambdaIntegration(importProductsFile);

        importRoute.addMethod('GET', importIntegration);
    }
}
