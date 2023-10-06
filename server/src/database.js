const {Client} = require('@notionhq/client');
const {executionTime} = require('./utils');

const Property = {
  Progress: 'Progress',
  English: 'English',
  LastRevised: 'Last Revised',
  Translation: 'Translation',
};

const Progress = {
  HaveProblems: 'Have problems',
  NeedToRepeat: 'Need to repeat',
  HaveToPayAttention: 'Have to pay attention',
  ActiveLearning: 'Active learning',
  Learned: 'Learned',
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
  getRandomPageForRevise = executionTime(
      'getRandomPageForRevise',
      async () => {
        const random = Math.random();
        const randomSort = Math.round(random); // 1 - ascending, 0 - descending
        const lastRevisedThreshhold = new Date();
        lastRevisedThreshhold.setMonth(lastRevisedThreshhold.getMonth() - 1);


        const response = await this.#client.databases.query({
          database_id: this.#databaseID,
          page_size: 10,
          filter: {
            and: [
              {
                property: Property.Progress,
                select: {
                  equals: Progress.Learned,
                },
              },
              {
                or: [
                  {
                    property: Property.LastRevised,
                    date: {
                      before: lastRevisedThreshhold,
                    },
                  },
                  {
                    property: Property.LastRevised,
                    date: {
                      is_empty: true,
                    },
                  },

                ],
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
      });

  /**
   * @return {Promise<Page|undefined>}
   */
  getRandomPageForLearn = executionTime('getRandomPageForLearn', async () => {
    const random = Math.random();
    const randomSort = Math.round(random); // 1 - ascending, 0 - descending
    const lastRevisedThreshhold = new Date();
    lastRevisedThreshhold.setMonth(lastRevisedThreshhold.getDay() - 2);


    const response = await this.#client.databases.query({
      database_id: this.#databaseID,
      page_size: 10,
      filter: {
        and: [
          {
            or: [
              {
                property: Property.Progress,
                select: {
                  equals: Progress.HaveProblems,
                },
              },
              {
                property: Property.Progress,
                select: {
                  equals: Progress.HaveToPayAttention,
                },
              },
              {
                property: Property.Progress,
                select: {
                  equals: Progress.NeedToRepeat,
                },
              },
              {
                property: Property.Progress,
                select: {
                  equals: Progress.ActiveLearning,
                },
              },
            ],
          },
          {
            or: [
              {
                property: Property.LastRevised,
                date: {
                  before: lastRevisedThreshhold,
                },
              },
              {
                property: Property.LastRevised,
                date: {
                  is_empty: true,
                },
              },

            ],
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
  });

  /**
   * @param {string} pageID
   * @return {Promise<Page>}
   */
  getPageById = executionTime('getPageById', async (pageID) => {
    return this.#client.pages.retrieve({page_id: pageID});
  });

  /**
   * @param {string} blockID
   * @return {Promise<
   *  import('@notionhq/client/build/src/api-endpoints')
   *   .ListBlockChildrenResponse
   *  >}
   */
  getBlockById = executionTime('getBlockById', async (blockID) => {
    return this.#client.blocks.children.list({
      block_id: blockID,
      page_size: 50,
    });
  });

  /**
   * @param {string} pageID
   * @return {Promis<Error|null>}
   */
  markPageAsForgotten = executionTime(
      'markPageAsForgotten',
      async (pageID) => {
        try {
          await this.#client.pages.update({
            page_id: pageID,
            properties: {
              [Property.Progress]: {
                type: 'select',
                select: {
                  name: Progress.HaveProblems,
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
      });

  /**
   * @param {string} pageID
   * @return {Promis<Error|null>}
   */
  markPageAsRevised = executionTime(
      'markPageAsRevised',
      async (pageID) => {
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
      });
}

module.exports = {
  Property,
  Progress,
  NotionDB,
};
