import { APIGatewayProxyResultV2, SQSEvent } from 'aws-lambda';

export async function main(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {

    }
}