import { SQSEvent } from 'aws-lambda';
import { createProduct } from '../repository';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient();

export const handler = async (event: SQSEvent): Promise<void> => {
    console.log('catalogBatchProcess: handling batch of massages from sqs');
    let extraPrice = false;
    try {
        for (const record of event.Records) {
            const product = JSON.parse(record.body);
            if (parseInt(product.price) >= 100) {
                extraPrice = true;
            }

            console.log(`catalogBatchProcess: got massage from sqs messageId - ${record.messageId}, body - ${record.body}`);
            await createProduct(
                product,
                process.env.PRODUCTS_TABLE_NAME!,
                process.env.STOCKS_TABLE_NAME!,
            );
            console.log(`catalogBatchProcess: "${record.body}" created from que message`);
        }

        await snsClient.send(
            new PublishCommand({
                Subject: `New products ${extraPrice ? 'with extra' : 'regular'} price added to the store catalog`,
                TopicArn: process.env.TOPIC_ARN,
                Message: event.Records.map(({ body }) => body).join('\n'),
                MessageAttributes: {
                    price : { DataType: 'String', StringValue: extraPrice ? 'extra-price' : 'regular-price' }
                },
            }),
        );
    } catch (error) {
        console.log(error);
    }
}