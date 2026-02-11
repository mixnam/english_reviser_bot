import {ObjectId, Binary} from 'mongodb';
import levenshtein from 'js-levenshtein';

import {getDb} from './repo.js';
import {executionTime, minusDaysFromNow} from './utils.js';
import {Logger} from 'pino';

const WORD_COLLECTION_NAME = 'english_words';

const Progress = {
  HaveProblems: 'Have problems',
  NeedToRepeat: 'Need to repeat',
  HaveToPayAttention: 'Have to pay attention',
  ActiveLearning: 'Active learning',
  Learned: 'Learned',
};

const ProgressOrder = [
  Progress.HaveProblems,
  Progress.HaveToPayAttention,
  Progress.NeedToRepeat,
  Progress.ActiveLearning,
  Progress.Learned,
];

const ProgressTimeSpace = {
  [Progress.HaveProblems]: 0,
  [Progress.HaveToPayAttention]: 1,
  [Progress.NeedToRepeat]: 3,
  [Progress.ActiveLearning]: 9,
  [Progress.Learned]: 27,
};

export type Word = {
  _id: string;
  userID: string;
  English: string;
  Translation: string;
  Examples?: string;
  Progress: string;
  Audio?: Uint8Array;
  TelegramAudioID?: string;
  TelegramPictureID?: string;
  ImageURL?: string;
  'Last Revised'?: Date;
}

type WordDTO = {
  _id: ObjectId;
  userID: string;
  English: string;
  Translation: string;
  Examples?: string;
  Progress: string;
  Audio?: Binary;
  TelegramAudioID?: string;
  TelegramPictureID?: string;
  ImageURL?: string;
  'Last Revised'?: Date;
}

const mapWord = (wordDto: WordDTO): Word => {
  return {
    ...wordDto,
    _id: wordDto._id.toString(),
    Audio: wordDto.Audio ?
      new Uint8Array(wordDto.Audio.buffer) :
      undefined,
  };
};

const updateWord = executionTime('updateWord',
    async (userID: string, word: Word, logger: Logger): Promise<Error | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.updateOne({
          _id: new ObjectId(word._id),
          userID: userID,
        }, {
          $set: {
            English: word.English,
            Translation: word.Translation,
            Examples: word.Examples,
            Audio: word.Audio ? new Binary(word.Audio) : undefined,
            TelegramAudioID: undefined,
          },
        });
        return null;
      } catch (err) {
        return new Error(`[repo][updateWord] - ${err}`);
      }
    });

const addNewWord = executionTime(
    'addNewWord',
    async (userID: string, word: Partial<Word>, logger: Logger): Promise<Error | string> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        const inserted = await words.insertOne({
          ...word,
          _id: new ObjectId(word._id),
          userID,
        });
        return inserted.insertedId.toString();
      } catch (err) {
        return new Error(`[repo][addNewWord] - ${err}`);
      }
    });


const getRandomWordByUserIDForRevise = executionTime(
    'getRandomWordByUserIDForRevise',
    async (userID: string, logger: Logger): Promise<Word | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      const result = words.aggregate([
        {
          $match: {
            userID,
            'Progress': Progress.Learned,
            'Last Revised': {
              $lt: minusDaysFromNow(ProgressTimeSpace[Progress.Learned]),
            },
          },
        },
        {
          $sample: {
            size: 1,
          },
        },
      ]);

      const wordDto = await result.next() as unknown as WordDTO;

      return wordDto ? mapWord(wordDto) : null;
    });

const getRandomWordByUserIDForLearn = executionTime(
    'getRandomWordByUserIDForLearn',
    async (userID: string, logger: Logger): Promise<Word | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      const result = words.aggregate([
        {
          $match: {
            $or: [
              {
                userID,
                'Progress': Progress.HaveProblems,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.HaveProblems]),
                },
              },
              {
                userID,
                'Progress': Progress.HaveToPayAttention,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.HaveToPayAttention]),
                },
              },
              {
                userID,
                'Progress': Progress.NeedToRepeat,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.NeedToRepeat]),
                },
              },
              {
                userID,
                'Progress': Progress.ActiveLearning,
                'Last Revised': {
                  $lt: minusDaysFromNow(ProgressTimeSpace[Progress.ActiveLearning]),
                },
              },
            ],
          },
        },
        {
          $sample: {
            size: 1,
          },
        },
      ]);

      const wordDto = await result.next() as unknown as WordDTO;

      return wordDto ? mapWord(wordDto) : null;
    });

const setWordProgress = executionTime(
    'setWordProgress',
    async (wordID: string, progress: string, logger: Logger): Promise<Error | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'Progress': progress,
                'Last Revised': new Date(),
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordProgress] - ${err}`);
      }
    });

const setWordTelegramAudioID = executionTime(
    'setWordTelegramAudioID',
    async (wordID: string, audioID: string, logger: Logger): Promise<Error | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'TelegramAudioID': audioID,
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordTelegramAudioID] - ${err}`);
      }
    });

const setWordTelegramPictureID = executionTime(
    'setWordPicture',
    async (wordID: string, telegramPictureID: string, logger: Logger): Promise<Error | null> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        await words.findOneAndUpdate(
            {_id: new ObjectId(wordID)},
            {
              $set: {
                'TelegramPictureID': telegramPictureID,
              },
            },
        );
        return null;
      } catch (err) {
        return new Error(`[repo][setWordTelegramPictureID] - ${err}`);
      }
    });


const getWordByID = executionTime(
    'getWordByID',
    async (wordID: string, logger: Logger): Promise<Word | null | Error> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        const wordDto = await words.findOne({
          _id: new ObjectId(wordID),
        }) as unknown as WordDTO;
        return wordDto ? mapWord(wordDto) : null;
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

const getWordByText = executionTime(
    'getWordByText',
    async (text: string, logger: Logger): Promise<Word | null | Error> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        // enchancment add text index
        const wordDto = await words.findOne({English: text}) as unknown as WordDTO;
        return wordDto ? mapWord(wordDto) : null;
      } catch (err) {
        return new Error(`[repo][getWordByID] - ${err}`);
      }
    });

const setWordAsRevisedByWordID = executionTime(
    'setWordAsRevisedByWordID',
    async (wordID: string, logger: Logger): Promise<Error | null> => {
      const result = await setWordProgress(wordID, Progress.Learned, logger);
      if (result !== null) {
        return new Error(`[repo][setWordAsRevisedByWordID] - ${result}`);
      }
      return null;
    });

const setWordAsForgottenByWordID = executionTime(
    'setWordAsForgottenByWordID',
    async (wordID: string, logger: Logger): Promise<Error | null> => {
      const result = await setWordProgress(wordID, Progress.HaveProblems, logger);
      if (result !== null) {
        return new Error(`[repo][setWordAsForgottenByWordID] - ${result}`);
      }
      return null;
    });

const getSpelcheckSuggestions = executionTime(
    'getSpelcheckSuggestions',
    async (newWord: string, userID: string, logger: Logger): Promise<Error | Array<{English: string}>> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      const result = words.find({userID}, {
        projection: {
          English: 1,
        },
      });

      const cleanWord = (word: string) => word
          .toLowerCase()
          .trim()
          .split(' ')
          .reduce((acc, w) =>
              acc.length < w.length ? w : acc
          , '');

      const newWordCleaned = cleanWord(newWord);

      const suggestions: Array<{English: string}> = [];
      try {
        for await (const word of result) {
          if (
            levenshtein(cleanWord(word['English']), newWordCleaned) <
              (newWordCleaned.length > 6 ? 2 : 1)
          ) {
            suggestions.push(
                word as unknown as {English: string},
            );
          }
        }
        return suggestions;
      } catch (err) {
        return new Error(`[repo][getSpelcheckSuggestions] - ${err}`);
      }
    });

const getWordsStats = executionTime(
    'getWordsStats',
    async (userID: string, logger: Logger): Promise<Error | Record<string, number>> => {
      const db = await getDb(logger);
      const words = db.collection(WORD_COLLECTION_NAME);

      try {
        const pipeline = [
          {
            $match: {
              userID: userID,
            },
          },
          {
            $group: {
              _id: '$Progress',
              count: {$sum: 1},
            },
          },
        ];

        const result = await words.aggregate(pipeline).toArray();
        const stats: Record<string, number> = {};
        result.forEach((item) => {
          if (item._id) {
            stats[item._id] = item.count;
          }
        });
        return stats;
      } catch (err) {
        return new Error(`[repo][getWordsStats] - ${err}`);
      }
    });


export {
  ProgressOrder,
  Progress,
  addNewWord,
  getWordByID,
  getWordByText,
  getRandomWordByUserIDForRevise,
  getRandomWordByUserIDForLearn,
  getSpelcheckSuggestions,
  setWordProgress,
  setWordTelegramAudioID,
  setWordAsRevisedByWordID,
  setWordAsForgottenByWordID,
  setWordTelegramPictureID,
  updateWord,
  getWordsStats,
};
