import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();


export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

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
            const stocksMap = stocks.Items.reduce((acc: Map<string, { count: number }>, item: { id: string, count: number}) => {
                acc.set(item.id, { count: item.count });
                return acc;
            }, new Map()) as Map<string, { id: string, count: number }>

            productsData = products.Items.map((product: { id: string }) => ({ ...product, ...stocksMap.get(product.id) }));
        }

        return {
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