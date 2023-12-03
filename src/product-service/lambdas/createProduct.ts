import { APIGatewayProxyEvent } from 'aws-lambda';
import { createProduct } from "../repository";

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`CREATE_PRODUCT_REQUEST: body params: ${event.body}`);
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing body' }),
            };
        }

        const data = JSON.parse(event.body);

        if (
            !data.title ||
            !data.description ||
            (!data.price || isNaN(parseInt(data.price))) ||
            (!data.count || isNaN(parseInt(data.count)))
        ) {
            console.log(`CREATE_PRODUCT_REQUEST: Missing or invalid body params`);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing or invalid body params' }),
            };
        }

        const product = await createProduct(
            data,
            process.env.PRODUCTS_TABLE_NAME,
            process.env.STOCKS_TABLE_NAME,
        );

        console.log(`CREATE_PRODUCT_REQUEST: CREATED`);
        return {
            statusCode: 201,
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