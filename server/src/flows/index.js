const {
  StepID: AddNewWordExamplesStepID,
  AddNewWordExamples,
} = require('./steps/addNewWordExamples');
const {
  StepID: AddNewWordExamplesForkStepID,
  AddNewWordExamplesFork,
}= require('./steps/addNewWordExamplesFork');
const {
  StepID: AddNewWordStepID,
  AddNewWord,
} = require('./steps/addNewWordStep');
const {
  StepID: AddNewWordSubbmitStepID,
  AddNewWordSubbmit,
} = require('./steps/addNewWordSubbmit');
const {
  StepID: AddNewWordTranslationsStepID,
  AddNewWordTranslations,
} = require('./steps/addNewWordTranslation');
const {
  StepID: AddNewWordSpellcheckStepID,
  AddNewWordSpellcheck,
} = require('./steps/addNewWordSpellcheck');
const {
  StepID: AddNewWordAgainToStudyStepID,
  AddNewWordAgainToStudy,
} = require('./steps/addNewWordAgainToStudy');
const {
  StepID: AddNewWordPictureForkStepID,
  AddNewWordPictureFork,
} = require('./steps/addNewWordPictureFork');
const {
  StepID: AddNewWordPictureStepID,
  AddNewWordPicture,
} = require('./steps/addNewWordPicture');
// eslint-disable-next-line
const {Step} = require('./steps/step');

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

module.exports = {
  AddNewWordFlow,
};
