#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductService } from './src/product-service/product-service-stack';
import { Cors, Deployment, Method, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NestedStack, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import  { ImportService } from './src/import-service/import-service-stack';
import { AuthorizationService } from './src/authorization-service/authorization-service-stack';
import * as sqs from 'aws-cdk-lib/aws-sqs';

class DeployStack extends NestedStack {
    constructor(scope: Construct, props: { restApiId: string; methods: Method[] } & StackProps) {
        super(scope, 'store-deployment', props);

        const deployment = new Deployment(this, 'store-deployment', {
            api: RestApi.fromRestApiId(this, 'store-rest-api', props.restApiId),
        });

        if (props.methods) {
            for (const method of props.methods) {
                deployment.node.addDependency(method);
            }
        }

        // TODO fix cdk staging, now have to choose stage manually after cdk deploy
        // new Stage(this, 'store-stage', { deployment, stageName: 'dev' });
    }
}

class RootStack extends Stack {
    constructor(scope: Construct) {
        super(scope, 'product-store');

        const api = new RestApi(this, 'store-api', {
            restApiName: 'product-store-api',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: Cors.DEFAULT_HEADERS,
            },
            deploy: true,
            deployOptions: {
                stageName: 'dev'
            },
        });

        api.addGatewayResponse("GatewayResponse4XX", {
            type: cdk.aws_apigateway.ResponseType.DEFAULT_4XX,
            responseHeaders: {
                "Access-Control-Allow-Origin": "'*'",
                "Access-Control-Allow-Headers":
                    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "Access-Control-Allow-Methods": "'OPTIONS,GET,PUT'",
            },
        });

        const catalogItemsQueue = new sqs.Queue(this, 'catalog-items-queue', {
            queueName: 'catalogItemsQueue',
        });

        const authorizationService = new AuthorizationService(this);

        const productsService = new ProductService(this, {
            restApiId: api.restApiId,
            restApiRootResourceId: api.restApiRootResourceId,
            queArn: catalogItemsQueue.queueArn,
        });

        const importService = new ImportService(this, {
            restApiId: api.restApiId,
            restApiRootResourceId: api.restApiRootResourceId,
            queArn: catalogItemsQueue.queueArn,
            tokenAuthorizer: authorizationService.tokenAuthorizer,
        });

        new DeployStack(this, {
            restApiId: api.restApiId,
            methods: [ ...productsService.methods, ...importService.methods ],
        });
    }
}

new RootStack(new cdk.App());