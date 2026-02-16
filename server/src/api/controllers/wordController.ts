import {FastifyRequest, FastifyReply} from 'fastify';
import {WordService} from '../services/wordService.js';
import {Word} from '../../repo/words.js';

export class WordController {
  constructor(private wordService: WordService) {}

  getRandomLearnWord = async (
      req: FastifyRequest<{
      Params: {chat_id: string};
    }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.getRandomLearnWord(
        Number.parseInt(req.params.chat_id),
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    if (result === null) {
      return res.code(404).send({message: 'No words to learn'});
    }

    return res.code(200).send(result);
  };

  updateLearnWordProgress = async (
      req: FastifyRequest<{
      Params: {chat_id: string; word_id: string};
      Body: {remember: boolean};
    }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.updateLearnWordProgress(
        Number.parseInt(req.params.chat_id),
        req.params.word_id,
        req.body.remember,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({success: true});
  };

  getRandomReviseWord = async (
      req: FastifyRequest<{
      Params: {chat_id: string};
    }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.getRandomReviseWord(
        Number.parseInt(req.params.chat_id),
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    if (result === null) {
      return res.code(404).send({message: 'No words to revise'});
    }

    return res.code(200).send(result);
  };

  updateWordProgress = async (
      req: FastifyRequest<{
      Params: {chat_id: string; word_id: string};
      Body: {remember: boolean};
    }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.updateWordProgress(
        Number.parseInt(req.params.chat_id),
        req.params.word_id,
        req.body.remember,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({success: true});
  };

  editWord = async (
      req: FastifyRequest<{
        Params: {chat_id: string; word_id: string};
      }>,
      res: FastifyReply,
  ) => {
    const messageID = req.headers['telegram-message-id'];
    if (typeof messageID !== 'string') {
      return res.code(403).send({message: 'No telegram-message-id header'});
    }

    const word = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Word);
    const result = await this.wordService.editWord(
        Number.parseInt(req.params.chat_id),
        Number.parseInt(messageID),
        word,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send();
  };
  getSimilarWords = async (
      req: FastifyRequest<{
        Params: {chat_id: string};
        Body: {word: string};
      }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.getSimilarWords(
        Number.parseInt(req.params.chat_id),
        req.body.word,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({words: result});
  };
  generateExample = async (
      req: FastifyRequest<{
        Params: {chat_id: string};
        Body: {word: string; translation: string};
      }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.generateExample(
        req.body.word,
        req.body.translation,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({example: result});
  };

  searchImages = async (
      req: FastifyRequest<{
          Params: {chat_id: string};
          Body: {word: string; offset?: number};
        }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.searchImages(req.body.word, req.body.offset);

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({urls: result});
  };

  uploadImage = async (
      req: FastifyRequest<{
          Params: {chat_id: string};
        }>,
      res: FastifyReply,
  ) => {
    const data = await req.file();
    if (!data) {
      return res.code(400).send({message: 'No file uploaded'});
    }

    const buffer = await data.toBuffer();
    const result = await this.wordService.uploadImage(buffer, data.mimetype);

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({url: result});
  };

  saveWord = async (
      req: FastifyRequest<{
        Params: {chat_id: string};
        Body: {
          word: string;
          translation: string;
          example: string | null;
          imageUrl: string | null;
        };
      }>,
      res: FastifyReply,
  ) => {
    const {word, translation, example, imageUrl} = req.body;
    const result = await this.wordService.saveWord(
        Number.parseInt(req.params.chat_id),
        word,
        translation,
        example,
        imageUrl,
    );

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send();
  };
}
