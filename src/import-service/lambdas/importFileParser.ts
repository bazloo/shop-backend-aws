import { S3Event } from 'aws-lambda';
import {
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { parse } from "csv-parse";
import { Readable } from "node:stream";

const s3Client = new S3Client();

const PARSED_FOLDER_NAME = 'parsed';

export const handler = async (event: S3Event) => {
    console.log(`PARSER: file parser was triggered`);
    try {
        for await (const record of event.Records) {
            const { key: originFilePath } = record.s3.object
            const [_, fileName] = originFilePath.split('/');

            console.log(`PARSER: started to parse file: ${fileName}`);
            const { Body } = await s3Client.send(
                new GetObjectCommand({
                    Bucket: record.s3.bucket.name,
                    Key: record.s3.object.key,
                })
            )

            const readStream = Body as Readable;

            if (!readStream) {
                console.log('Can not read object from record')
            } else {
                const parseFile = new Promise((resolve, reject) => {
                    readStream.pipe(parse())
                        .on('data', function (row) {
                            console.log(row);
                        })
                        .on('end', function () {
                            console.log(`PARSER: finished parsing file: ${fileName}`);
                            resolve();
                        })
                        .on('error', function (error) {
                            console.log(error.message);
                            reject()
                        });
                });

                await parseFile;

                await s3Client.send(
                    new CopyObjectCommand({
                        CopySource: `${record.s3.bucket.name}/${originFilePath}`,
                        Bucket: record.s3.bucket.name,
                        Key: `${PARSED_FOLDER_NAME}/${fileName}`,
                    }),
                );

                console.log(`PARSER: copied parsed file to: ${PARSED_FOLDER_NAME}/${fileName}`);

                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: record.s3.bucket.name,
                        Key: originFilePath,
                    }),
                );

                console.log(`PARSER: deleted parsed file from: ${originFilePath}`);
            }
        }
    } catch (error) {
        console.log(error);
    }
};