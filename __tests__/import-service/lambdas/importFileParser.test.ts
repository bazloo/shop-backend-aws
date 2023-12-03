import { handler as importFileParser } from "../../../src/import-service/lambdas/importFileParser";
import { S3Event } from "aws-lambda";
import {
    copyObject,
    deleteObject,
    getObjectStream,
} from "../../../src/import-service/bucket-actions";
import { csvParser } from "../../../src/import-service/csv-parser";

const MOCKED_S3_EVENT = {
    Records: [
        {
            s3: {
                object: {
                    key: "test.csv",
                },
                bucket: {
                    name: "test",
                },
            },
        }
    ]
} as S3Event;

jest.mock('../../../src/import-service/bucket-actions', () => ({
    getObjectStream: jest.fn(() => Promise.resolve({})),
    copyObject: jest.fn(),
    deleteObject: jest.fn(),
}));

jest.mock('../../../src/import-service/csv-parser', () => ({
    csvParser: jest.fn(() => Promise.resolve([['test']])),
}));

describe('importFileParser:', () => {
    test('Called all internal functionality', async () => {
        await importFileParser(MOCKED_S3_EVENT);
        expect(getObjectStream).toHaveBeenCalled();
        expect(csvParser).toHaveBeenCalled();
        expect(copyObject).toHaveBeenCalled();
        expect(deleteObject).toHaveBeenCalled();
    });
});
