var helpers = {};
var logger = require('./logger');
var Account = require('./Account');
var Match = require('./Match');

// task should have an account and a match
helpers.getMMR = function(task, done) {
  logger.info('sending request for ' + task.account.accountID);
  
  accountIDInt = parseInt(task.account.accountID.substring(1));

  task.dota2.requestProfileCard(accountIDInt, function(err, profileData) {
    if (!profileData || !profileData.slots) return done('no profile card returned');
    console.log(profileData.slots);
    var soloMMR = profileData.slots.reduce(function(acc, card) {
      if (card.stat && card.stat.stat_id === 1) {
        return card.stat.stat_score;
      }
      return acc;
    }, -1);
    
    
    if (!task.match) return done('No match data received. I NEED DA MATCH DATA!!!');
    
    if (err) {
      logger.error('Error getting profile data', err);
      logger.info(profileData);
      return done(err);
    }
    
    if (soloMMR === -1) return done('Cannot find MMR for ' + task.account.username + ', ' + task.account.accountID);
    
    // THE PROBLEM MIGHT BE THAT THE GC GETS THE UPDATED MMR AFTER THE WEB API
    // IF WE GET HERE AND THE GC DOESN'T KNOW ABOUT THE API CHANGE YET, THEN THE
    // MATCH WILL BE LOST. NEED TO TRY AGAIN FOR UP TO 5-10 MINUTES OR SO TO GET
    // THE NEW MMR IF IT WAS A RANKED MATCH (LOBBY TYPE 6 OR 7?)
    
    var mmrChange = soloMMR - task.account.currentMMR;
    
    
    // Should probably retry a bit, but then give up retrying after a while and just update the account
    if (!mmrChange) {
      logger.info('Match found but no MMR change, adding match anyway to update last played.');
    }
    task.match.setProps({ mmrChange: mmrChange });
    
    if (!task.account.steamID) {
      task.account.steamID = '_' + task.dota2.ToSteamID(task.account.accountID.substring(1));
    }
    
    task.account.setProps({
      accountID: task.account.accountID,
      steamID: task.account.steamID,
      username: profileData.player_name,
      currentMMR: soloMMR,
      lastPlayed: task.match.startTime,
      match: task.match
    });

    console.log('updating account with this info: ', task.account);
    task.account.update(function(err, account) {
      if (err) return done(err);
      logger.info('updated account', account);
      done(null, account);
    });
  });  
};

module.exports = helpers;
