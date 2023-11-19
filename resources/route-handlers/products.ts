import { APIGatewayProxyEvent } from 'aws-lambda';
import { getProducts } from "../../mock-data/products";

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

        const products = getProducts();

        return {
            statusCode: 200,
            body: JSON.stringify(products),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};