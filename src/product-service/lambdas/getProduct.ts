import { APIGatewayProxyEvent } from 'aws-lambda';
import { getProductById } from "../repository";

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`GET_PRODUCT_REQUEST: product id: ${event.pathParameters?.id}`);
    const id = event.pathParameters?.id;

    if (!id) {
        console.log(`GET_PRODUCT_REQUEST: Missing path parameter: id`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing path parameter: id' }),
        };
    }

    try {
        const product = await getProductById(
            id,
            process.env.PRODUCTS_TABLE_NAME,
            process.env.STOCKS_TABLE_NAME
        );

        console.log(`GET_PRODUCT_REQUEST: SUCCESS`);

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