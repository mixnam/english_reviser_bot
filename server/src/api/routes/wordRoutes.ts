import {FastifyInstance} from 'fastify';
import {WordController} from '../controllers/wordController.js';

export const wordRoutes = async (
    fastify: FastifyInstance,
    options: {
        wordController: WordController
    },
) => {
  const {wordController} = options;

  fastify.get('/chat/:chat_id/word/random-learn', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
    },
    handler: wordController.getRandomLearnWord,
  });

  fastify.post('/chat/:chat_id/word/:word_id/learn-progress', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
          word_id: {type: 'string'},
        },
        required: ['chat_id', 'word_id'],
      },
      body: {
        type: 'object',
        properties: {
          remember: {type: 'boolean'},
        },
        required: ['remember'],
      },
    },
    handler: wordController.updateLearnWordProgress,
  });

  fastify.get('/chat/:chat_id/word/random-revise', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
    },
    handler: wordController.getRandomReviseWord,
  });

  fastify.post('/chat/:chat_id/word/:word_id/progress', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
          word_id: {type: 'string'},
        },
        required: ['chat_id', 'word_id'],
      },
      body: {
        type: 'object',
        properties: {
          remember: {type: 'boolean'},
        },
        required: ['remember'],
      },
    },
    handler: wordController.updateWordProgress,
  });

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
          translation: {type: 'string'},
        },
        required: ['word', 'translation'],
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
          offset: {type: 'number'},
        },
        required: ['word'],
      },
    },
    handler: wordController.searchImages,
  });

  fastify.post('/chat/:chat_id/word/image/upload', {
    schema: {
      params: {
        type: 'object',
        properties: {
          chat_id: {type: 'string'},
        },
        required: ['chat_id'],
      },
    },
    handler: wordController.uploadImage,
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
