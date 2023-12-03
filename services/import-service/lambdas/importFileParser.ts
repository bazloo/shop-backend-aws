import { S3Event } from 'aws-lambda';
import {
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { parse } from "csv-parse";
import { Readable } from "node:stream";

const s3Client = new S3Client();

export const handler = async (event: S3Event) => {
    //console.log(`PARSER`);
    try {
        for await (const record of event.Records) {
            const { Body }= await s3Client.send(
                new GetObjectCommand({
                    Bucket: record.s3.bucket.name,
                    Key: record.s3.object.key,
                })
            )

            const readStream = Body as Readable;

            if (!readStream) {
                console.log('Can not read object from record')
            } else {
                readStream.pipe(parse({ delimiter: ",", from_line: 2 }))
                    .on("data", function (row) {
                        console.log(row);
                    })
                    .on("end", function () {
                        console.log("finished");
                    })
                    .on("error", function (error) {
                        console.log(error.message);
                    });
            }
        }
    } catch (error) {
        console.log(error);
    }
};