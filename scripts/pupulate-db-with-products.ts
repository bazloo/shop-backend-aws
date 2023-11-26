import { execa } from 'execa';
const { exec } = require("child_process");
import { getProducts, getStocks } from "../mock-data/products";
import { dataToItem } from 'dynamo-converters';

const productsTableName = 'Products';
const stocksTableName = 'Stocks';

const command = `aws dynamodb put-item --table-name {name} --item '{item}'`;

(() => {
    return Promise.all([
        ...getProducts()
            .map((product) => exec(
                `${command.replace('{name}', productsTableName).replace('{item}', JSON.stringify(dataToItem(product)))}`),
                (error) => {
                    if (error) throw error;
                }
            ),
        ...getStocks()
            .map((stock) => exec(
                `${command.replace('{name}', stocksTableName).replace('{item}', JSON.stringify(dataToItem(stock)))}`),
                (error) => {
                    if (error) throw error;
                }
            )
    ])
        .then(() => console.log('Dynamodb tables were populated with Products and Stocks'))
        .catch((error) => console.log(error));
})();