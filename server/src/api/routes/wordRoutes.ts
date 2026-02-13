import {FastifyInstance} from 'fastify';
import {WordController} from '../controllers/wordController.js';

export const wordRoutes = async (
    fastify: FastifyInstance,
    options: {
        wordController: WordController
    },
) => {
  const {wordController} = options;

  fastify.post('/chat/:chat_id/word/:word_id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
          word_id: {type: 'string'},
        },
        required: ['chat_id', 'word_id'],
      },
      headers: {
        type: 'object',
        properties: {
          'telegram-message-id': {type: 'string'},
        },
        required: ['telegram-message-id'],
      },
    },
    handler: wordController.editWord,
  });

  fastify.post('/chat/:chat_id/word/similar', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
      body: {
        type: 'object',
        properties: {
          word: {type: 'string'},
        },
        required: ['word'],
      },
    },
    handler: wordController.getSimilarWords,
  });

  fastify.post('/chat/:chat_id/word/example', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
      body: {
        type: 'object',
        properties: {
          word: {type: 'string'},
          translate: {type: 'string'},
        },
        required: ['word', 'translate'],
      },
    },
    handler: wordController.generateExample,
  });

  fastify.post('/chat/:chat_id/word/image/search', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
      body: {
        type: 'object',
        properties: {
          word: {type: 'string'},
        },
        required: ['word'],
      },
    },
    handler: wordController.searchImages,
  });

  fastify.post('/chat/:chat_id/word/save', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
      body: {
        type: 'object',
        properties: {
          word: {type: 'string'},
          translation: {type: 'string'},
          example: {type: ['string', 'null']},
          imageUrl: {type: ['string', 'null']},
        },
        required: ['word', 'translation'],
      },
    },
    handler: wordController.saveWord,
  });
};
