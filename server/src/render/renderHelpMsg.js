const renderHelpMsg = () => `
This bot can help you learn and review English words.

First, you can add a new word using the /add command.

Then, with the /learn command, once a day, you should try to remember the word's translation. If you remember it, press UP; if not, press DOWN. The word is considered learned once it has gone through all the stages from bottom to top:
    
    *Learned 🟢*
    *Active Learning 🔵*
    *Need to repeat 🟡*
    *Have to pay attention 🟠*
    *Have problems 🔴*
    
Afterward, you can revise and check your learned words using the /revise command. If you don't remember a word, you can mark it as forgotten, and it will return to the very bottom stage of learning.add - I help you to add new word you want to learn
`;

module.exports = {
  renderHelpMsg,
};
