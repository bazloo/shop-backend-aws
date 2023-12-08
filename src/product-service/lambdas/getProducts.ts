import { APIGatewayProxyEvent } from 'aws-lambda';
import { getProducts } from '../repository';

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`GET_PRODUCTS_REQUEST`);
    try {
        const products = await getProducts(
            process.env.PRODUCTS_TABLE_NAME,
            process.env.STOCKS_TABLE_NAME,
        );

        console.log(`GET_PRODUCTS_REQUEST: SUCCESS`);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode: 200,
            body: JSON.stringify(products || []),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};