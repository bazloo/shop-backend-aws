import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from "node:crypto";
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`CREATE_PRODUCT_REQUEST: body params: ${event.body}`);
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing body' }),
            };
        }

        const { title, description, price, count } = JSON.parse(event.body);

        if (
            !title ||
            !description ||
            (!price || isNaN(parseInt(price))) ||
            (!count || isNaN(parseInt(count)))
        ) {
            console.log(`CREATE_PRODUCT_REQUEST: Missing or invalid body params`);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing or invalid body params' }),
            };
        }

        const id = randomUUID();

        await dynamodb.send(
            new TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: process.env.PRODUCTS_TABLE_NAME,
                            Item: {
                                id,
                                title,
                                description,
                                price,
                            },
                        },
                    },
                    {
                        Put: {
                            TableName: process.env.STOCKS_TABLE_NAME,
                            Item: {
                                product_id: id,
                                count,
                            },
                        },
                    },
                ],
            }),
        );

        console.log(`CREATE_PRODUCT_REQUEST: CREATED`);
        return {
            statusCode: 201,
            body: JSON.stringify({}),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};