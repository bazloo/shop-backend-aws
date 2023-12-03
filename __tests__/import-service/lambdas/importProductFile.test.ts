import { handler as importProductFile } from "../../../src/import-service/lambdas/importProductFile";
import {APIGatewayProxyEventHeaders, APIGatewayProxyEventMultiValueHeaders} from "aws-lambda/trigger/api-gateway-proxy";
import {APIGatewayProxyEvent} from "aws-lambda";

const MOCKED_PROXY_EVENT = {
    body: '',
    headers: {} as APIGatewayProxyEventHeaders,
    multiValueHeaders: {} as APIGatewayProxyEventMultiValueHeaders,
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '',
    pathParameters:  null,
    queryStringParameters: null,
    multiValueQueryStringParameters:  null,
    stageVariables: null,
    requestContext: {},
    resource: '',
} as APIGatewayProxyEvent;


jest.mock('../../../src/import-service/bucket-actions', () => ({
    getSignedUploadUrl: jest.fn(() => 'test'),
}));

describe('importProductFile:', () => {
    test('Returns 400 status code when "name" query parameter is undefined', async () => {
        const { statusCode } = await importProductFile({ ...MOCKED_PROXY_EVENT,  queryStringParameters: {} });
        expect(statusCode).toEqual(400);
    });

    test('Returns 200 status code and signed url', async () => {
        const { statusCode, body } = await importProductFile({ ...MOCKED_PROXY_EVENT,  queryStringParameters: { name: 'test'} });
        expect(statusCode).toEqual(200);
        expect(body).toEqual(JSON.stringify({ signedUrl: 'test' }));
    });
});