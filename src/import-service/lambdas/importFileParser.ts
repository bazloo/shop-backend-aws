import { S3Event } from 'aws-lambda';
import {
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getObjectStream, copyObject, deleteObject } from "../bucket-actions";
import { csvParser } from "../csv-parser";

import { parse } from "csv-parse";
import { Readable } from "node:stream";

const PARSED_FOLDER_NAME = 'parsed';

export const handler = async (event: S3Event) => {
    console.log(`PARSER: file parser was triggered`);
    try {
        for await (const record of event.Records) {
            const { key: originFilePath } = record.s3.object;
            const { name: bucketName } = record.s3.bucket;
            const [_, fileName] = originFilePath.split('/');

            console.log(`PARSER: started to parse file: ${fileName}`);

            const readStream = await getObjectStream(bucketName, originFilePath);

            if (readStream) {
                await csvParser(readStream);

                console.log(`PARSER: finished parsing file: ${fileName}`);

                await copyObject(
                    `${record.s3.bucket.name}/${originFilePath}`,
                    bucketName,
                    `${PARSED_FOLDER_NAME}/${fileName}`,
                );

                console.log(`PARSER: copied parsed file to: ${PARSED_FOLDER_NAME}/${fileName}`);

                await deleteObject(bucketName, originFilePath)

                console.log(`PARSER: deleted parsed file from: ${originFilePath}`);
            } else {
                console.log('Can not read object from record');
            }
        }
    } catch (error) {
        console.log(error);
    }
};