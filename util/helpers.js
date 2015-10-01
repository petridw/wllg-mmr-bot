var helpers = {};
var logger = require('./logger');
var request = require('request');
var port = require('config').get('server').port;

helpers.getMMR = function getMMR(task, done) {
  logger.info('sending request for ' + task.accountID);
  
  task.dota2.requestProfile(task.accountID, true, function(err, profileData) {
    logger.info('Received profile response');

    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) return done();
    
    logger.info('received data for ' + profileData.player_name);
    
    var updated_account = {
      accountID: '_' + task.accountID,
      steamID: '_' + task.dota2.ToSteamID(task.accountID),
      username: profileData.player_name,
      currentMMR: profileData.game_account_client.solo_competitive_rank
    };
    
    // Update Account using API
    var request_options = {
      url: 'http://localhost:' + port + '/api/accounts',
      method: 'PUT',
      json: true,
      body: updated_account
    };
    
    request(request_options, function(err, res, body) {
      if (err) {
        logger.error(err);
      }
      logger.info('Received response from API');
      console.log(body ? 'created new entry' : 'updated entry');
      return done();
    });
        
  });  
};


module.exports = helpers;
