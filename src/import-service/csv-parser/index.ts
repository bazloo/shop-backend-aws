import { Readable } from "node:stream";
import { parse } from "csv-parse";

export const csvParser = (stream: Readable) => {
    let data: string[][] = [];

    return new Promise((resolve, reject) => {
        stream.pipe(parse())
            .on('data', function (row) {
                console.log(row);
                data.push(row);
            })
            .on('end', function () {
                resolve(data);
            })
            .on('error', function (error) {
                console.log(error.message);
                reject()
            });
    });
}