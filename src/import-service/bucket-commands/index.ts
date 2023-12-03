import {
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { parse } from "csv-parse";
import { Readable } from "node:stream";

const s3Client = new S3Client();

export const getObjectStream = async (Bucket: string, Key: string) => {
    const { Body } = await s3Client.send(
        new GetObjectCommand({
            Bucket,
            Key,
        })
    )

    return Body as Readable || undefined;
};

export const copyObject = (CopySource: string, Bucket: string, Key: string) => {
    return s3Client.send(
        new CopyObjectCommand({
            CopySource,
            Bucket,
            Key,
        }),
    );
};

export const deleteObject = (Bucket: string, Key: string) => {
    return s3Client.send(
        new DeleteObjectCommand({
            Bucket,
            Key,
        }),
    );
};