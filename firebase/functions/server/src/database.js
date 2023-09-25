const {Client} = require('@notionhq/client');

const Property = {
  Progress: 'Progress',
  English: 'English',
  LastRevised: 'Last Revised',
  Translation: 'Translation',
};

/**
 * @typedef Page
 * @type {object}
 * @property {string} id
 * @property {Object.<Property, RichText>} properties
 */

/**
 * NotionDB
 */
class NotionDB {
  #client;
  #databaseID;

  /**
   * @param {string} secret - notion API key secret
   * @param {string} databaseID - notion database id
   */
  constructor(secret, databaseID) {
    this.#client = new Client({
      auth: secret,
    });
    this.#databaseID = databaseID;
  }

  /**
   * @return {Promise<(Page|undefined)>}
   */
  getRandomPageForRevise = async () => {
    const random = Math.random();
    const randomPageSize = Math.round(random * 100);
    const randomSort = Math.round(random); // 1 - ascending, 0 - descending
    const lastRevisedThreshhold = new Date();
    lastRevisedThreshhold.setMonth(lastRevisedThreshhold.getMonth() - 1);


    const response = await this.#client.databases.query({
      database_id: this.#databaseID,
      page_size: randomPageSize,
      filter: {
        or: [
          {
            property: Property.Progress,
            select: {
              equals: 'Learned',
            },
          },
          {
            property: Property.LastRevised,
            date: {
              before: lastRevisedThreshhold,
            },
          },
        ],
      },
      sorts: [{
        timestamp: 'created_time',
        direction: randomSort ? 'ascending' : 'descending',
      }],
    });

    const randomPage = Math.round(random * (response.results.length - 1));
    const page = response.results[randomPage];
    return page;
  };

  /**
   * @param {string} pageID
   * @return {Promise<Page>}
   */
  getPageById = async (pageID) => {
    return this.#client.pages.retrieve({page_id: pageID});
  };

  /**
   * @param {string} pageID
   * @return {Promis<Error|null>}
   */
  markPageAsForgotten = async (pageID) => {
    try {
      await this.#client.pages.update({
        page_id: pageID,
        properties: {
          [Property.Progress]: {
            type: 'select',
            select: {
              name: 'Have problems',
              color: 'red',
            },
          },
          [Property.LastRevised]: {
            type: 'date',
            date: {
              start: new Date(),
            },
          },
        },
      });
    } catch (err) {
      return new Error(`error in markPageAsForgotten - ${err}`);
    }
    return null;
  };

  /**
   * @param {string} pageID
   * @return {Promis<Error|null>}
   */
  markPageAsRevised = async (pageID) => {
    try {
      await this.#client.pages.update({
        page_id: pageID,
        properties: {
          [Property.LastRevised]: {
            type: 'date',
            date: {
              start: new Date(),
            },
          },
        },
      });
    } catch (err) {
      return new Error(`error in markPageAsRevised - ${err}`);
    }
    return null;
  };
}

module.exports = {
  Property,
  NotionDB,
};
