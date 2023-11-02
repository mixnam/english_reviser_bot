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
// eslint-disable-next-line
const {Step} = require('./steps/step');

/**
 * @type {Object.<string, Step>}
 */
const AddNewWordFlow = {
  [AddNewWordStepID]: new AddNewWord(AddNewWordTranslationsStepID),
  [AddNewWordExamplesStepID]: new AddNewWordExamples(AddNewWordSubbmitStepID),
  [AddNewWordTranslationsStepID]:
    new AddNewWordTranslations(AddNewWordExamplesForkStepID),
  [AddNewWordExamplesForkStepID]:
    new AddNewWordExamplesFork(
        AddNewWordExamplesStepID,
        AddNewWordSubbmitStepID,
    ),
  [AddNewWordSubbmitStepID]: new AddNewWordSubbmit(null),
};

module.exports = {
  AddNewWordFlow,
};
