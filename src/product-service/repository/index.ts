import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {QueryCommand, ScanCommand, TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {randomUUID} from "node:crypto";

const dynamodb = new DynamoDB();

export const getProducts = async (productsTableName: string, stocksTableName: string) => {
    const [products, stocks] = await Promise.all([
        dynamodb.send(
            new ScanCommand({
                TableName: productsTableName,
            })
        ),
        dynamodb.send(
            new ScanCommand({
                TableName: stocksTableName,
            })
        ),
    ]);

    if (
        stocks &&
        stocks.Items &&
        products &&
        products.Items
    ) {
        const stocksMap = stocks.Items.reduce((acc: Map<string, { count: number }>, item: { product_id: string, count: number }) => {
            acc.set(item.product_id, { count: item.count });
            return acc;
        }, new Map()) as Map<string, { count: number }>

        return  products.Items.map((product: { id: string }) => ({ ...product, ...stocksMap.get(product.id) }));
    }
}

export const getProductById = async (id: string, productsTableName: string, stocksTableName: string) => {
    const [products, stocks] = await Promise.all([
        dynamodb.send(
            new QueryCommand({
                TableName: productsTableName,
                KeyConditionExpression: "id = :id",
                ExpressionAttributeValues: {
                    ":id": id,
                },
            }),
        ),
        dynamodb.send(
            new QueryCommand({
                TableName: stocksTableName,
                KeyConditionExpression: "product_id = :product_id",
                ExpressionAttributeValues: { ":product_id": id },
            }),
        ),
    ]);

    if (!products.Items) {
        throw new Error(`Product with ${id} does not exist`);
    }

    if (!stocks.Items) {
        throw new Error(`Sock for product with ${id} does not exist`);
    }

    const { count = 0 } = stocks.Items.at(0);

    return {
        ...products.Items.at(0),
        ...{ count },
    }
};

export const createProduct = async (data: {
    id: string;
    title: string;
    description: string;
    price: number;
    count: number;
}, productsTableName: string, stocksTableName: string) => {
    const {
        title,
        description,
        price,
        count,
    } = data;

    const id = randomUUID();

    await dynamodb.send(
        new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: productsTableName,
                        Item: {
                            id,
                            title,
                            description,
                            price,
                        },
                    },
                },
                {
                    Put: {
                        TableName: stocksTableName,
                        Item: {
                            product_id: id,
                            count,
                        },
                    },
                },
            ],
        }),
    );

    return { id, ...data };
};