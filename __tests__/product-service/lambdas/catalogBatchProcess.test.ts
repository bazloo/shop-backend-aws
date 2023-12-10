import { handler as catalogBatchProcess } from '../../../src/product-service/lambdas/catalogBatchProcess';
import { SQSEvent } from 'aws-lambda';
import { createProduct } from '../../../src/product-service/repository';
import { PublishCommand  } from "@aws-sdk/client-sns";

const MOCKED_SQS_EVENT = {
    Records: [
        {
            messageId: '1',
            body: '{"title":"test","price":"10","count":"10","description":"test"}',
            attributes: {},
            messageAttributes: {},
        }
    ]
}  as unknown as SQSEvent;

jest.mock('@aws-sdk/client-sns', () => ({
    SNSClient: jest.fn(),
    PublishCommand: jest.fn(),
}));

jest.mock('../../../src/product-service/repository', () => ({
    createProduct: jest.fn(),
}));

describe('catalogBatchProcess:', () => {
    test('publish to SNS, message for products with regular price filter - lower tan 100$', async () => {
        const PUBLISH_MESSAGE_REGULAR_FOR_REGULAR_PRICE = {
            Message: "{\"title\":\"test\",\"price\":\"10\",\"count\":\"10\",\"description\":\"test\"}",
            MessageAttributes: {price: {DataType: 'String', StringValue: 'regular-price'}},
            Subject: "New products with regular price added to the store catalog",
            TopicArn: undefined,
        }

        await catalogBatchProcess(MOCKED_SQS_EVENT);
        expect(createProduct).toHaveBeenCalled();
        expect(PublishCommand).toHaveBeenCalledWith(PUBLISH_MESSAGE_REGULAR_FOR_REGULAR_PRICE);
    });

    test('publish to SNS, message for products with extra price filter - grater than 100$', async () => {
        const PUBLISH_MESSAGE_REGULAR_FOR_REGULAR_PRICE = {
            Message: "{\"title\":\"test\",\"price\":\"101\",\"count\":\"10\",\"description\":\"test\"}",
            MessageAttributes: {price: {DataType: 'String', StringValue: 'extra-price'}},
            Subject: "New products with extra price added to the store catalog",
            TopicArn: undefined,
        }

        MOCKED_SQS_EVENT.Records[0].body = '{"title":"test","price":"101","count":"10","description":"test"}'

        await catalogBatchProcess(MOCKED_SQS_EVENT);
        expect(createProduct).toHaveBeenCalled();
        expect(PublishCommand).toHaveBeenCalledWith(PUBLISH_MESSAGE_REGULAR_FOR_REGULAR_PRICE);
    });
});
