import {SaveData, Storage} from '@google-cloud/storage';
import {Logger} from 'pino';

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

  /**
   * Uploads an image to a Google Cloud Storage bucket.
   * @param fileData The image content as a buffer, string or stream.
   * @param fileName The name of the file to save in the bucket.
   * @param logger Logger instance.
   * @returns A promise that resolves to the public URL of the uploaded image.
   */
  upload = async (
      fileData: SaveData,
      fileName: string,
      logger: Logger,
  ): Promise<string> => {
    logger.debug({fileName, bucket: this.bucket}, 'Starting image upload to GCS');

    if (!this.bucket) {
      throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET is not set');
    }

    try {
      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(fileName);

      await file.save(fileData, {
        resumable: false,
      });

      logger.info({fileName}, 'Image uploaded successfully to GCS');

      // Assuming the bucket is public or we just return the gs:// URI or similar.
      // Usually keeping it simple:
      return `https://storage.googleapis.com/${this.bucket}/${fileName}`;
    } catch (err) {
      logger.error({err, fileName, bucket: this.bucket}, 'Error uploading image to GCS');
      throw err;
    }
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
