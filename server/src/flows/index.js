import {
  StepID as AddNewWordExamplesStepID,
  AddNewWordExamples,
} from './steps/addNewWordExamples.js';
import {
  StepID as AddNewWordExamplesForkStepID,
  AddNewWordExamplesFork,
} from './steps/addNewWordExamplesFork.js';
import {
  StepID as AddNewWordStepID,
  AddNewWord,
} from './steps/addNewWordStep.js';
import {
  StepID as AddNewWordSubbmitStepID,
  AddNewWordSubbmit,
} from './steps/addNewWordSubbmit.js';
import {
  StepID as AddNewWordTranslationsStepID,
  AddNewWordTranslations,
} from './steps/addNewWordTranslation.js';
import {
  StepID as AddNewWordSpellcheckStepID,
  AddNewWordSpellcheck,
} from './steps/addNewWordSpellcheck.js';
import {
  StepID as AddNewWordAgainToStudyStepID,
  AddNewWordAgainToStudy,
} from './steps/addNewWordAgainToStudy.js';
import {
  StepID as AddNewWordPictureForkStepID,
  AddNewWordPictureFork,
} from './steps/addNewWordPictureFork.js';
import {
  StepID as AddNewWordPictureStepID,
  AddNewWordPicture,
} from './steps/addNewWordPicture.js';
// eslint-disable-next-line
import {Step} from './steps/step.js';

/**
 * @type {Object.<string, Step>}
 */
const AddNewWordFlow = {
  [AddNewWordStepID]: new AddNewWord(
      AddNewWordTranslationsStepID,
      AddNewWordSpellcheckStepID,
  ),
  [AddNewWordExamplesStepID]: new AddNewWordExamples(AddNewWordPictureForkStepID),
  [AddNewWordTranslationsStepID]:
    new AddNewWordTranslations(AddNewWordExamplesForkStepID),
  [AddNewWordExamplesForkStepID]:
    new AddNewWordExamplesFork(
        AddNewWordExamplesStepID,
        AddNewWordPictureForkStepID,
    ),
  [AddNewWordSpellcheckStepID]: new AddNewWordSpellcheck(
      AddNewWordTranslationsStepID,
      AddNewWordAgainToStudyStepID,
  ),
  [AddNewWordSubbmitStepID]: new AddNewWordSubbmit(null),
  [AddNewWordAgainToStudyStepID]: new AddNewWordAgainToStudy(null),
  [AddNewWordPictureForkStepID]: new AddNewWordPictureFork(
      AddNewWordPictureStepID,
      AddNewWordSubbmitStepID,
  ),
  [AddNewWordPictureStepID]: new AddNewWordPicture(AddNewWordSubbmitStepID),
};

export {
  AddNewWordFlow,
};
