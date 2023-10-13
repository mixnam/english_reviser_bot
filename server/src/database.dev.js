const {NotionDB, Property} = require('./database');
const dotenv = require('dotenv');

dotenv.config();

const notion = new NotionDB(
    process.env.NOTION_SECRET,
    process.env.NOTION_DATABASE_ID,
);

(async () => {
  const page = await notion.getRandomPageForLearn();
  if (page) {
    console.log(page.properties[Property.Progress]);
  }
  console.log(JSON.stringify(page, undefined, 2));
})();
