import { APIGatewayProxyEvent } from 'aws-lambda'
import {
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUploadUrl } from "../bucket-actions";

const s3Client = new S3Client();

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(`IMPORT: started import for file with name: ${event.queryStringParameters?.name}`);
    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
        console.log(`IMPORT: query parameter 'name' is undefined`);
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode: 400,
            body: JSON.stringify({ message: 'Query parameter "name" is required' }),
        };
    }

    try {
        const signedUrl = await getSignedUploadUrl(process.env.UPLOAD_BUCKET_NAME!, `uploaded/${fileName}`);

        console.log(`IMPORT: successfully created signed url for file upload`);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode: 200,
            body: JSON.stringify({ signedUrl }),
        };
    } catch (error) {
        console.log(error);

        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            statusCode: 500,
            body: JSON.stringify({ message: error }),
        };
    }
};