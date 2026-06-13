const fs = require('fs');
const urls = JSON.parse(fs.readFileSync('d:/Crown eve/crown-eve-center/processing/r2-urls.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('d:/Crown eve/crown-eve-center/processing/products.json', 'utf8')).products;
console.log('URLs in r2-urls.json:', Object.keys(urls).length);
console.log('Total products in manifest:', products.length);
