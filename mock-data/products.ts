import { randomUUID } from "node:crypto";

const PRODUCTS = [
    {
        id: randomUUID(),
        title: 'Prudence',
        price: 0,
        description: 'the ability to discern the appropriate course of action to be taken in a given situation at the appropriate time.',
    },
    {
        id: randomUUID(),
        title: 'Fortitude',
        price: 0,
        description: ' also termed courage, forbearance, strength, endurance, and the ability to confront fear, uncertainty, and intimidation.',
    },
    {
        id: randomUUID(),
        title: 'Temperance',
        price: 0,
        description: 'also known as restraint, the practice of self-control, abstention, discretion, and moderation tempering the appetition. Plato considered sōphrosynē, which may also be translated as sound-mindedness, to be the most important virtue.',
    },
    {
        id: randomUUID(),
        title: 'Justice',
        price: 0,
        description: 'also considered as fairness; the Greek word also having the meaning of righteousness.',
    },
];

export const getProducts = () => PRODUCTS;
export const getStocks = () => PRODUCTS.map(({ id }) => ({ product_id: id, count: 0 }));