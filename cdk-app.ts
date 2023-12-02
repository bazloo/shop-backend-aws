#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductService } from './services/product-service/product-service-stack';
import { Cors, RestApi } from "aws-cdk-lib/aws-apigateway";
import {Stack} from "aws-cdk-lib";
import { Construct } from "constructs";
import  { ImportService } from "./services/import-service/import-service-stack";

class RootStack extends Stack {
    constructor(scope: Construct) {
        super(scope, 'product-store');

        const api = new RestApi(this, 'RestAPI', {
            restApiName: 'ProductServiceAPI',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
            },
        });

        const productService = new ProductService(this, {
            restApiId: api.restApiId,
            restApiRootResourceId: api.restApiRootResourceId,
        });

        const booksStack = new ImportService(this, {
            restApiId: api.restApiId,
            restApiRootResourceId: api.restApiRootResourceId,
        });

        // new DeployStack(this, {
        //     restApiId: restApi.restApiId,
        //     methods: petsStack.methods.concat(booksStack.methods),
        // });
    }
}

new RootStack(new cdk.App());