import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
const faq = data.data.modelIntrospection.models.WebsiteFaq;
console.log(JSON.stringify(faq.fields, null, 2));
