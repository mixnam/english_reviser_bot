import {GridFSBucket, ObjectId} from 'mongodb';

import {getDb} from './repo.js';
import {executionTime} from './utils.js';

const uploadPicture = executionTime('uploadPicture',
    /**
     * @param {import('node:stream').Readable} fileStream
     * @param {import('./utils.js').Logger} logger
     *
     * @returns {Promise<string>}
     */
    async (fileStream, logger) => {
      const db = await getDb(logger);
      const bucket = new GridFSBucket(db, {bucketName: 'images'});
      const fileName = new ObjectId().toString();
      const writableStream = bucket.openUploadStream(fileName);
      fileStream.pipe(writableStream);

      return new Promise((resolve, reject) => {
        writableStream.on('finish', () => resolve(fileName));
        writableStream.on('error', (err) => reject(err));
      });
    },
);


const downloadPictrure = executionTime('downloadPictrure',
    /**
     * @param {string} fileName
     * @param {import('./utils.js').Logger} logger
     *
     * @returns {Promise<import('node:stream').Readable>}
     */
    async (fileName, logger) => {
      const db = await getDb(logger);
      const bucket = new GridFSBucket(db, {bucketName: 'images'});

      return bucket.openDownloadStreamByName(fileName);
    },
);

export {
  uploadPicture,
  downloadPictrure,
};
