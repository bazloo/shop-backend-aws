import {NestedStack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {LambdaIntegration, Method, RestApi,} from 'aws-cdk-lib/aws-apigateway';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

const BUCKET_NAME = '';

export class ImportService extends NestedStack {
    public readonly methods: Method[] = [];

    constructor(scope: Construct, props: { restApiId: string, restApiRootResourceId: string } & StackProps) {
        super(scope, 'import-service', props);

        const api = RestApi.fromRestApiAttributes(this, 'import-rest-api', {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId,
        });

        // import existing bucket from bucket name
        const bucket = Bucket.fromBucketName(
            this,
            'imports-bucket',
            'store-imports-bucket',
        );

        const importProductsFile = new NodejsFunction(this, 'import-products-file', {
            entry: 'src/import-service/lambdas/importProductFile.ts',
            handler: 'handler',
            environment: {
                UPLOAD_BUCKET_NAME: 'store-imports-bucket',
            }
        });


        const importFileParser = new NodejsFunction(this, 'import-file-parser', {
            entry: 'src/import-service/lambdas/importFileParser.ts',
            handler: 'handler',
        });

        const importRoute = api.root.addResource('import');

        const importIntegration = new LambdaIntegration(importProductsFile);

        const method = importRoute.addMethod('GET', importIntegration, {
            requestParameters: {
                "method.request.querystring.name": true,
            }
        });

        this.methods = [method];

        bucket.grantPut(importProductsFile)
        bucket.grantRead(importFileParser);
        bucket.grantDelete(importFileParser);
        bucket.addEventNotification(
            EventType.OBJECT_CREATED,
            new LambdaDestination(importFileParser),
            {
                prefix: 'uploaded',
            }
        );

        // In our case we have created bucket manually with needed permissions and allowed cors settings

        // Below is example how to add new policy if we would need it

        // new PolicyStatement({
        //     actions: ['s3:GetObject', "s3:PutObject"],
        //     resources: [bucket.arnForObjects('*')],
        //     effect: Effect.ALLOW,
        // });
    }
}
