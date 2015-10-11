var helpers = {};
var logger = require('./logger');
var Account = require('./Account');
var Match = require('./Match');

// task should have an account and a match
helpers.getMMR = function(task, done) {
  logger.info('sending request for ' + task.account.accountID);
  console.log(task.match);
  
  accountIDInt = parseInt(task.account.accountID.substring(1));
  
  task.dota2.requestProfile(accountIDInt, true, function(err, profileData) {

    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) {
      logger.error('Did not get account mmr back from dota :(');
      return done();
    }
    
    var mmrChange = profileData.game_account_client.solo_competitive_rank - task.account.currentMMR;
    
    if (!mmrChange) {
      logger.info('no MMR change, updating last played');

      task.account.setProps({
        accountID: task.account.accountID,
        lastPlayed: task.match.startTime
      });
    } else {
      task.match.setProps({ mmrChange: mmrChange });
      
      if (!task.account.steamID) {
        task.account.steamID = '_' + task.dota2.ToSteamID(task.account.accountID.substring(1));
      }
      
      task.account.setProps({
        accountID: task.account.accountID,
        steamID: task.account.steamID,
        username: profileData.player_name,
        currentMMR: profileData.game_account_client.solo_competitive_rank,
        lastPlayed: task.match.startTime,
        match: task.match
      });
    }

    console.log('updating account with this info: ', task.account);
    task.account.update(done);
  });  
};

module.exports = helpers;
