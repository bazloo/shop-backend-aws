import {
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    S3Client, PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { Readable } from "node:stream";

const s3Client = new S3Client();

export const getObjectStream = async (Bucket: string, Key: string)=> {
    const { Body } = await s3Client.send(
        new GetObjectCommand({
            Bucket,
            Key,
        })
    )

    if (Body) return Body as Readable;
    return undefined;
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

export const getSignedUploadUrl = async (Bucket: string, Key: string) => {
    const putCommand = new PutObjectCommand({
        Bucket,
        Key,
    });

    return getSignedUrl(s3Client, putCommand, {
        expiresIn: 300,
    });
}