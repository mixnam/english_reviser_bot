const {NotionDB} = require('./database');
const dotenv = require('dotenv');

dotenv.config();

const notion = new NotionDB(
    process.env.NOTION_SECRET,
    process.env.NOTION_DATABASE_ID,
);

(async () => {
  const page = await notion.getBlockById('47958c6ea7ca439fb96dc78179c08eb4');
  console.log(JSON.stringify(page, undefined, 2));
})();
