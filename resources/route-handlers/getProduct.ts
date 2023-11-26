import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();

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
        const [products, stocks] = await Promise.all([
            dynamodb.send(
                new QueryCommand({
                    TableName: process.env.PRODUCTS_TABLE_NAME,
                    KeyConditionExpression: "id = :id",
                    ExpressionAttributeValues: {
                        ":id": id,
                    },
                }),
            ),
            dynamodb.send(
                new QueryCommand({
                    TableName: process.env.STOCKS_TABLE_NAME,
                    KeyConditionExpression: "product_id = :product_id",
                    ExpressionAttributeValues: { ":product_id": id },
                }),
            ),
        ]);

        if (!products.Items) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Product with ${id} does not exist` }),
            };
        }

        if (!stocks.Items) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Sock for product with ${id} does not exist` }),
            };
        }

        const { count = 0 } = stocks.Items.at(0);

        console.log(`GET_PRODUCT_REQUEST: SUCCESS`);

        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    ...products.Items.at(0),
                    ...{ count },
                }
            ),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};