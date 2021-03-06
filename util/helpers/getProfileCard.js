var fs = require('fs');

function getProfileCard(task, next) {
  var dota2 = task.dota2;
  var accountID = task.accountID;
  var success = task.success;
  logger.info(`Getting profile card for ${accountID}`);
  
  // fs.readFile(__dirname + '/../../profileCardRequests.json', function());
  
  dota2.requestProfileCard(parseInt(accountID.substring(1)), function(err, profileCard) {
    if (err) logger.error(err);
    if (!profileCard || !profileCard.slots) throw new Error('No profile data returned from GC.');
    if (err) throw new Error(err);
    
    next(null);
    return success(profileCard);
  });
}

module.exports = getProfileCard;
