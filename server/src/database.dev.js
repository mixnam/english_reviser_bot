const {getClient} = require('./repo/repo');

(async () => {
  const client = await getClient();
  const db = client.db('englishbot');
  const words = db.collection('english_words');
  const users = db.collection('users');

  const user = await users.findOne({username: 'mixnam'});
  if (user === null) {
    console.log('cant find user');
    return;
  }


  const lastRevisedThreshhold = new Date();
  lastRevisedThreshhold.setDate(lastRevisedThreshhold.getDate() - 14);
  const result = words.aggregate([
    {
      $match: {
        'Last Revised': {
          $lt: lastRevisedThreshhold,
        },
      },
    },
    {
      $sample: {
        size: 1,
      },
    },
  ]);

  console.log((await result.hasNext()));
  console.log((await result.next()));
})();
