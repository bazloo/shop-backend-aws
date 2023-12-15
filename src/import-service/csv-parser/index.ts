import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { validateProduct } from "./productValidation";
export const csvParser = (stream: Readable) => {
    let headers: string[];
    const products: object[] = [];

    return new Promise((resolve, reject) => {
        stream.pipe(parse())
            .on('data', function (row) {
                if (!headers) {
                    headers = row;
                } else {
                    const productObject = row.reduce((acc: { [key: string]: string }, value: string, index: number) => {
                        acc[headers[index]] = value;
                        return acc;
                    }, {})

                    try {
                        products.push(validateProduct(productObject));
                    } catch (error) {
                        console.log(`csvParser: invalid product object: ${productObject}`);
                    }
                }
            })
            .on('end', function () {
                console.log(`csvParser: got records: ${products}`);
                resolve(products);
            })
            .on('error', function (error) {
                console.log(error.message);
                reject()
            });
    });
}