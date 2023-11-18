import { APIGatewayProxyEvent } from 'aws-lambda';
import { PRODUCTS } from "../../mock-data/products";

export const handler = async (event: APIGatewayProxyEvent) => {
    const id = event.pathParameters?.id;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing path parameter: id' }),
        };
    }

    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

        const product = PRODUCTS.find((product) => product.id === id);

        if (!product) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Product with ${id} does not exist` }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(product),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};