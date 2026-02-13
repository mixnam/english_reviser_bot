import {FastifyRequest, FastifyReply} from 'fastify';
import {WordService} from '../services/wordService.js';
import {Word} from '../../repo/words.js';

export class WordController {
  constructor(private wordService: WordService) {}

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
        Body: {word: string; translate: string};
      }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.generateExample(
        req.body.word,
        req.body.translate,
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
        Body: {word: string};
      }>,
      res: FastifyReply,
  ) => {
    const result = await this.wordService.searchImages(req.body.word);

    if (result instanceof Error) {
      req.log.error(result);
      return res.code(500).send({message: result.message});
    }

    return res.code(200).send({urls: result});
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
