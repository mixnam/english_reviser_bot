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
  [AddNewWordExamplesStepID]: new AddNewWordExamples(AddNewWordSubbmitStepID),
  [AddNewWordTranslationsStepID]:
    new AddNewWordTranslations(AddNewWordExamplesForkStepID),
  [AddNewWordExamplesForkStepID]:
    new AddNewWordExamplesFork(
        AddNewWordExamplesStepID,
        AddNewWordSubbmitStepID,
    ),
  [AddNewWordSpellcheckStepID]: new AddNewWordSpellcheck(
      AddNewWordTranslationsStepID,
      AddNewWordAgainToStudyStepID,
  ),
  [AddNewWordSubbmitStepID]: new AddNewWordSubbmit(null),
  [AddNewWordAgainToStudyStepID]: new AddNewWordAgainToStudy(null),
};

module.exports = {
  AddNewWordFlow,
};
