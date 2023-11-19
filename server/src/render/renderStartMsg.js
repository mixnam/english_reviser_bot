const renderStartError = () => `
Sorry, there is some problem 🤕.
Let me figure it out and try to /start one more time later.
`;

const renderStartSuccess = () => `
Hey!
I will help you to study english words everyday!
Here is what can I do:
/revise - Start a revising exercise 
/learn - Start a learning exercise  
/add - I help you to add new word you want to learn
`;

module.exports = {
  renderStartError,
  renderStartSuccess,
};
