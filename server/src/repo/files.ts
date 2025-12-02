import {GridFSBucket, ObjectId} from 'mongodb';
import {Readable} from 'node:stream';

import {getDb} from './repo.js';
import {executionTime} from './utils.js';
import {Logger} from 'pino';

const uploadPicture = executionTime('uploadPicture',
    async (fileStream: Readable, logger: Logger): Promise<string> => {
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
    async (fileName: string, logger: Logger): Promise<Readable> => {
      const db = await getDb(logger);
      const bucket = new GridFSBucket(db, {bucketName: 'images'});

      return bucket.openDownloadStreamByName(fileName);
    },
);

export {
  uploadPicture,
  downloadPictrure,
};
