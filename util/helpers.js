var helpers = {};
var logger = require('./logger');
var async = require('async');
var Account = require('./models/Account');

helpers.getMMR = function getMMR(task, done) {
  logger.info('sending request for ' + task.accountID);
  
  task.dota2.requestProfile(task.accountID, true, function(err, profileData) {
    logger.info('profile response');
    console.log(profileData);
    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) return done();
    
    logger.info('received data for ' + profileData.player_name);
    
    Account.findOne({
      where: {
        accountID: task.accountID
      }
    }).then(function(user) {
      if (user) {
        console.log('found user');
        user.currentMMR = profileData.game_account_client.solo_competitive_rank;
        user.save().then(function(result) {
          return done();
        });
      } else {
        console.log('making new user');
        Account.create({
          accountID: task.accountID,
          username: profileData.player_name,
          startingMMR: profileData.game_account_client.solo_competitive_rank,
          currentMMR: profileData.game_account_client.solo_competitive_rank
        }).then(function(user) {
          return done();
        });
      }
    }, function(err) {
      logger.error(err);
      return done();
    });
        
  });  
};


module.exports = helpers;
