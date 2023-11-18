import { APIGatewayProxyEvent } from 'aws-lambda';
import { PRODUCTS } from "../../mock-data/products";

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(PRODUCTS),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};