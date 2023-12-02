import { NestedStack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Cors,
    LambdaIntegration, Method,
    RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class ImportService extends NestedStack {
    public readonly methods: Method[] = [];

    constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string } & StackProps) {
        super(scope, 'import-service', props);

        const api = RestApi.fromRestApiAttributes(this, 'import-rest-api', {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId,
        });

        const importProductsFile = new NodejsFunction(this, 'import-products-file', {
            entry: 'services/import-service/lambdas/importProductFile.ts',
            handler: 'handler',
            environment: {
                UPLOAD_BUCKET_NAME: 'store-imports-bucket',
            }
        });

        // const importFileParser = new NodejsFunction(this, 'import-file-parser', {
        //     entry: '',
        //     handler: 'handler',
        // });

        const importRoute = api.root.addResource('import');

        const importIntegration = new LambdaIntegration(importProductsFile);

        const method = importRoute.addMethod('GET', importIntegration, {
            requestParameters: {
                "method.request.querystring.name": true,
            }
        });

        this.methods = [method];
    }
}
