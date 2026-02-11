import {SaveData, Storage} from '@google-cloud/storage';
import {Logger} from 'pino';

type FileType = 'audio' | 'image'

class GoogleCloudStorageService {
  private storage: Storage;
  private bucket: string;

  constructor(bucket: string) {
    const storageOptions = process.env.GOOGLE_APPLICATION_CREDENTIALS ? {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    } : {};
    this.storage = new Storage(storageOptions);
    this.bucket = bucket;
  }

  private upload = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<null> => {
    logger.debug({fileName, bucket: this.bucket}, 'Starting upload to GCS');

    try {
      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(fileName);

      await file.save(fileData, {
        resumable: false,
      });

      logger.info({fileName, bucket: this.bucket}, 'File uploaded successfully to GCS');


      return null;
    } catch (err) {
      logger.error({err, fileName, bucket: this.bucket}, 'Error uploading file to GCS');
      throw err;
    }
  };

  private getPublicUrl = (fileName: string, fileType: FileType): string => {
    switch (fileType) {
      case 'audio':
        return `https://storage.googleapis.com/${this.bucket}/audio/${fileName}`;
      case 'image':
        return `https://storage.googleapis.com/${this.bucket}/images/${fileName}`;
      default:
        ((_unreachable: never) => {})(fileType);
    }
  };

  /**
   * Uploads an image to a Google Cloud Storage bucket.
   */
  uploadImage = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<string> => {
    await this.upload(fileData, fileName, logger);
    return this.getPublicUrl(fileName, 'image');
  };

  /**
   * Uploads an audio file to a Google Cloud Storage bucket.
   */
  uploadAudio = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<string> => {
    await this.upload(fileData, fileName, logger);
    return this.getPublicUrl(fileName, 'audio');
  };
}

let instance: GoogleCloudStorageService;

const getInstance = (): GoogleCloudStorageService => {
  if (!instance) {
    instance = new GoogleCloudStorageService(
        process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    );
  }
  return instance;
};

export {getInstance};

