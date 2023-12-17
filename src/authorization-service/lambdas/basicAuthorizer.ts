import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent):Promise<APIGatewayAuthorizerResult | string> => {
    console.log(`BASIC_AUTHORIZER: processing`);

    const policyResponse = (access: boolean = false, principalId: string = '') => ({
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: access ? 'Allow' : 'Deny',
                    Resource: event.methodArn,
                },
            ],
        }
    });

    const token = event.authorizationToken.replace(/^Basic /, '');
    console.log(`BASIC_AUTHORIZER: token - ${token}`);

    if (!token || token === 'null') {
        console.log(`BASIC_AUTHORIZER: authorisation token is not provided`);
        throw new Error('Unauthorized');
    }

    const buffer = Buffer.from(token, 'base64');
    const [userName, pass] = buffer.toString('utf-8').split(':');

    const areCredentialsValid = process.env.USER_NAME === userName &&
        process.env.USER_PASS === pass;

    const response = policyResponse(areCredentialsValid, userName);

    console.log(`BASIC_AUTHORIZER: policy response - ${JSON.stringify(response)}`);

    return response;
};

