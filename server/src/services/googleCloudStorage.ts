import {SaveData, Storage} from '@google-cloud/storage';
import {Logger} from 'pino';

type FileType = 'audio' | 'images'
type FilePath = `${FileType}/${string}`

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
      filePath: FilePath,
      logger: Logger,
  ): Promise<null> => {
    logger.debug({filePath, bucket: this.bucket}, 'Starting upload to GCS');

    try {
      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(filePath);

      await file.save(fileData, {
        resumable: false,
      });

      logger.info({filePath, bucket: this.bucket}, 'File uploaded successfully to GCS');


      return null;
    } catch (err) {
      logger.error({err, filePath, bucket: this.bucket}, 'Error uploading file to GCS');
      throw err;
    }
  };

  private getPublicUrl = (filePath: FilePath): string => {
    return `https://storage.googleapis.com/${this.bucket}/${filePath}`;
  };

  /**
   * Uploads an image to a Google Cloud Storage bucket.
   */
  uploadImage = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<string> => {
    const filePath: FilePath = `images/${fileName}`;
    await this.upload(fileData, filePath, logger);
    return this.getPublicUrl(filePath);
  };

  /**
   * Uploads an audio file to a Google Cloud Storage bucket.
   */
  uploadAudio = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<string> => {
    const filePath: FilePath = `audio/${fileName}`;
    await this.upload(fileData, filePath, logger);
    return this.getPublicUrl(filePath);
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

