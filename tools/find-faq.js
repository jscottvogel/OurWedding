import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));

// The models are usually under data.models or something similar. Let's just traverse to find WebsiteFaq
function findWebsiteFaq(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.name === 'WebsiteFaq') {
    console.log(JSON.stringify(obj, null, 2));
    process.exit(0);
  }
  for (const key in obj) {
    findWebsiteFaq(obj[key]);
  }
}

findWebsiteFaq(data);
console.log('WebsiteFaq not found');
