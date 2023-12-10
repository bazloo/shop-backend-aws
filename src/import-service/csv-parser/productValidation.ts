export const validateProduct = (product: { title: string, price: string, description: string, count: string }) => {
    const { title, price } = product;
    let { description, count } = product;

    if (!title) throw new Error('Title field is required for product');
    if (!price) throw new Error('Price field is required for product');
    if (isNaN(parseInt(price))) throw new Error('Price field should be a number');
    if (!count) count = '0';
    if (isNaN(parseInt(count))) count = '0';
    if (!description) description = '';

    return { title, price, description, count };
}