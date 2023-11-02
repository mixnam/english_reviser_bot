/**
 * Step
 */
class Step {
  nextStepID;

  /**
   * @param {string} nextStepID
   */
  constructor(nextStepID) {
    this.nextStepID = nextStepID;
  }
  // eslint-disable-next-line
  /**
   * @param {string|null} userAnswer
   * @param {import("../../repo/users").User} user
   * @return {[Object, string]}
   */
  makeTransition = async (userAnswer, user) => {
    throw new Error('makeTransition is not implemented');
  };

  // eslint-disable-next-line
  /**
   * @param {import("../../repo/users").User} user
   * @return {string}
   */
  makeAction = async (user) => {
    throw new Error('makeAction is not implemented');
  };
}

module.exports = {
  Step,
};
