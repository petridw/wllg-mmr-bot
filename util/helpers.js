var helpers = {};
var logger = require('./logger');
var request = require('request');
var port = require('config').get('server').port;
var host = require('config').get('server').host;


helpers.getMMR = function(task, done) {
  logger.info('sending request for ' + task.accountID);
  
  task.dota2.requestProfile(task.accountID, true, function(err, profileData) {
    logger.info('Received profile response');

    if (!profileData || !profileData.game_account_client || !profileData.game_account_client.solo_competitive_rank) return done();
    
    logger.info('received data for ' + profileData.player_name);
    
    var updated_account = {
      accountID: '_' + task.accountID,
      steamID: '_' + task.dota2.ToSteamID(task.accountID),
      username: profileData.player_name,
      currentMMR: profileData.game_account_client.solo_competitive_rank, 
      matchID: task.match.matchID,
      startTime: task.match.startTime
    };
    
    updateAccount(updated_account, done);
  });  
};

function updateAccount(options, done) {
  var request_options = {
    url: 'http://' + host + ':' + port + '/api/accounts',
    method: 'PUT',
    json: true,
    body: options
  };
  
  request(request_options, function(err, res, body) {
    if (err) {
      logger.error(err);
    }
    logger.info('Received response from API');
    console.log(body ? 'created new entry' : 'updated entry');
    return done();
  });
}


module.exports = helpers;
