var helpers = {};
var logger = require('./logger');
var Account = require('./Account');
var Match = require('./Match');

// task should have an account and a match
helpers.getMMR = function(task, done) {
  logger.info('sending request for ' + task.account.accountID);
  
  accountIDInt = parseInt(task.account.accountID.substring(1));

  task.dota2.requestProfileCard(accountIDInt, function(err, profileData) {
    
    console.log('PROFILE CARD?!?!');
    var stats = profileData.slots.reduce(function(acc, card) {
      if (card.stat) {
        return acc.concat(card.stat);
      }
      return acc;
    }, []);
    stats.forEach(function(stat) {
      console.log('stat_id: ' + stat.stat_id + '. score: ' + stat.stat_score);
    });
    
    if (!task.match) return done('No match data received. I NEED DA MATCH DATA!!!');
    if (err) {
      logger.error('Error getting profile data', err);
      logger.info(profileData);
      return done(err);
    }
    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) {
      logger.error('Did not get account mmr back from dota :(');
      return done('No mmr data :(');
    }
    
    // THE PROBLEM MIGHT BE THAT THE GC GETS THE UPDATED MMR AFTER THE WEB API
    // IF WE GET HERE AND THE GC DOESN'T KNOW ABOUT THE API CHANGE YET, THEN THE
    // MATCH WILL BE LOST. NEED TO TRY AGAIN FOR UP TO 5-10 MINUTES OR SO TO GET
    // THE NEW MMR IF IT WAS A RANKED MATCH (LOBBY TYPE 6 OR 7?)
    
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
    task.account.update(function(err, account) {
      if (err) return done(err);
      logger.info('updated account', account);
      done(null, account);
    });
  });  
};

module.exports = helpers;
