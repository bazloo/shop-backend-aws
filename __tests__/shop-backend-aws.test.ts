import { handler as productsHandler } from "../services/product-service/resources/route-handlers/getProducts";
import { handler as  productHandler } from "../services/product-service/resources/route-handlers/getProduct";
import { APIGatewayProxyEvent } from "aws-lambda";
import {
    APIGatewayProxyEventHeaders,
    APIGatewayProxyEventMultiValueHeaders,
} from "aws-lambda/trigger/api-gateway-proxy";

const MOCKED_PRODUCTS = [
    {
        id: '10',
        title: 'test',
        price: 10,
        description: 'test',
        count: 0,
    },
];

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


jest.mock('../mock-data/products', () => ({
    getProducts: () => MOCKED_PRODUCTS,
}));

describe('Product Handler', () => {
    test('Returns 400 status code when request method is not available', async () => {
        const { statusCode } = await productHandler({ httpMethod: 'POST' } as APIGatewayProxyEvent);
        expect(statusCode).toEqual(400);
    });

    test('Returns 400 status code when request method is not available', async () => {
        const { statusCode } = await productHandler({ httpMethod: 'GET' } as APIGatewayProxyEvent);
        expect(statusCode).toEqual(400);
    });

    test('Returns 400 status code when "id" parameter is undefined', async () => {
        const { statusCode } = await productHandler({ ...MOCKED_PROXY_EVENT,  pathParameters: { id: undefined } });
        expect(statusCode).toEqual(400);
    });

    test('Returns 404 status code when product is not found', async () => {
        const { statusCode } = await productHandler({ ...MOCKED_PROXY_EVENT,  pathParameters: { id: '777' } });
        expect(statusCode).toEqual(404);
    });

    test('Returns product inside body and 200 status code when product is found', async () => {
        const id = '10';
        const { statusCode, body } = await productHandler({ ...MOCKED_PROXY_EVENT,  pathParameters: { id } });
        expect(statusCode).toEqual(200);
        expect(JSON.parse(body)).toStrictEqual(MOCKED_PRODUCTS.find((product) => product.id === id));
    });
});

describe('Products Handler', () => {
    test('Returns 400 status code when request method is not available', async () => {
        const { statusCode } = await productsHandler({ httpMethod: 'POST' } as APIGatewayProxyEvent);
        expect(statusCode).toEqual(400);
    });

    test('Returns products list inside body and 200 status code', async () => {
        const { statusCode, body } = await productsHandler({ httpMethod: 'GET' } as APIGatewayProxyEvent);
        expect(statusCode).toEqual(200);
        expect(JSON.parse(body)).toStrictEqual(MOCKED_PRODUCTS);
    });
});