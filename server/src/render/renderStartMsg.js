const renderStartError = () => `
Sorry, there is some problem 🤕.
Let me figure it out and try to /start one more time later.
`;

const renderStartSuccess = () => `
Hey!
I will help you to study english words everyday!
Here is what can I do:
/revise - I will give you one random word you've added and want to repeat
/learn - I will give you one random word you've added you want to learn
/add - I help you to add new word you want to learn
/stats - I show you your current word progress
`;

module.exports = {
  renderStartError,
  renderStartSuccess,
};
