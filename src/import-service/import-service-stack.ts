import { NestedStack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    AuthorizationType,
    LambdaIntegration,
    Method,
    RestApi,
    TokenAuthorizer,
    Cors,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class ImportService extends NestedStack {
    public readonly methods: Method[] = [];

    constructor(
        scope: Construct, props: {
            restApiId: string,
            restApiRootResourceId: string,
            queArn: string,
            tokenAuthorizer: TokenAuthorizer,
        } & StackProps
    ) {
        super(scope, 'import-service', props);

        const api = RestApi.fromRestApiAttributes(this, 'import-rest-api', {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId,
        });

        const catalogItemsQueue = sqs.Queue.fromQueueArn(this, 'catalog-items-queue', props.queArn);

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
            environment: {
                UPLOAD_BUCKET_NAME: 'store-imports-bucket',
                QUEUE_URL: catalogItemsQueue.queueUrl,
            }
        });

        const importRoute = api.root.addResource('import');

        const importIntegration = new LambdaIntegration(importProductsFile);

        const method = importRoute.addMethod('GET', importIntegration, {
            authorizer: props.tokenAuthorizer,
            authorizationType: AuthorizationType.CUSTOM,
        });

        importRoute.addCorsPreflight({
            allowOrigins: Cors.ALL_ORIGINS,
            allowHeaders: Cors.DEFAULT_HEADERS,
            allowMethods: ["GET", "OPTIONS"],
        });

        this.methods = [method];

        catalogItemsQueue.grantSendMessages(importFileParser);

        bucket.grantPut(importProductsFile);
        bucket.grantPut(importFileParser);
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
        //     actions: ['s3:GetObject', "s3:PutObject",],
        //     resources: [bucket.arnForObjects('*')],
        //     effect: Effect.ALLOW,
        // });
    }
}
