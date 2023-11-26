import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from "node:crypto";
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

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
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing or invalid body params' }),
            };
        }

        const id = randomUUID();

        await dynamodb.send(
            new PutCommand({
                TableName: process.env.PRODUCTS_TABLE_NAME,
                Item: {
                    id,
                    title,
                    description,
                    price,
                },
            })
        );

        await dynamodb.send(
            new PutCommand({
                TableName: process.env.STOCKS_TABLE_NAME,
                Item: {
                    id,
                    count,
                },
            })
        );

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