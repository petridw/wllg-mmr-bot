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

    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) return done();
    
    var mmrChange = profileData.game_account_client.solo_competitive_rank - task.account.currentMMR;
    
    if (!mmrChange) {
      logger.info('not updating because no MMR change (it was probably a team ranked instead of solo)');
      return done();
    }
    
    task.match.setProps({ mmrChange: mmrChange });
    
    var updated_account = {
      accountID: task.account.accountID,
      steamID: task.account.steamID,
      username: profileData.player_name,
      currentMMR: profileData.game_account_client.solo_competitive_rank,
      lastPlayed: task.match.startTime,
      match: task.match
    };
    
    console.log('updating account with this info: ', updated_account);
    task.account.setProps(updated_account);
    task.account.update(done);
  });  
};

module.exports = helpers;
