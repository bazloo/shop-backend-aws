import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();


export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`GET_PRODUCTS_REQUEST`);
    try {
        const [products, stocks] = await Promise.all([
            await dynamodb.send(
                new ScanCommand({
                    TableName: process.env.PRODUCTS_TABLE_NAME,
                })
            ),
            dynamodb.send(
                new ScanCommand({
                    TableName: process.env.STOCKS_TABLE_NAME,
                })
            ),
        ]);

        let productsData;

        if (
            stocks &&
            stocks.Items &&
            products &&
            products.Items
        ) {
            const stocksMap = stocks.Items.reduce((acc: Map<string, { count: number }>, item: { product_id: string, count: number}) => {
                acc.set(item.product_id, { count: item.count });
                return acc;
            }, new Map()) as Map<string, { count: number }>

            productsData = products.Items.map((product: { id: string }) => ({ ...product, ...stocksMap.get(product.id) }));
        } // TODO refactor

        console.log(`GET_PRODUCTS_REQUEST: SUCCESS`);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode: 200,
            body: JSON.stringify(productsData || []),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};