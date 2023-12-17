import { NestedStack } from 'aws-cdk-lib';
import {Construct} from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { TokenAuthorizer, IdentitySource } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";

export class AuthorizationService extends NestedStack {
    public tokenAuthorizer: TokenAuthorizer;

    constructor(scope: Construct) {
        super(scope, 'authorization-service');

        const basicAuthorizer = new NodejsFunction(this, 'basic-authorizer', {
            entry: 'src/authorization-service/lambdas/basicAuthorizer.ts',
            handler: 'handler',
            environment: {
                USER_NAME: process.env.USER_NAME!,
                USER_PASS: process.env.USER_PASS!
            }
        });

        const basicAuthorizerRole = new Role(this, "basic-authorizer-role", {
            assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
        });

        basicAuthorizerRole.addToPolicy(
            new PolicyStatement({
                actions: ["lambda:InvokeFunction"],
                resources: [basicAuthorizer.functionArn],
            }),
        );

        this.tokenAuthorizer = new TokenAuthorizer(this, "token-authorizer", {
            handler: basicAuthorizer,
            identitySource: IdentitySource.header("authorization"),
            resultsCacheTtl: Duration.seconds(0),
            assumeRole: basicAuthorizerRole,
        });
    }
}
