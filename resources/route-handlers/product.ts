import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB();

export const handler = async (event: APIGatewayProxyEvent) => {
    const id = event.pathParameters?.id;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing path parameter: id' }),
        };
    }

    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Not available HTTP method for this route' }),
            };
        }

        const result = await dynamodb.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME,
                Key: {
                    pk: `POST#${id}`,
                },
            })
        );

        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Product with ${id} does not exist` }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
        };
    } catch (error) {
        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};