var helpers = {};
var logger = require('./logger');
var User = require('./models/User');
var async = require('async');

helpers.getMMR = function getMMR(task, done) {
  logger.info('in queue, processing player ' + task.accountId);
    
  async.retry({ times: 10, interval: 0 }, profileRequest, function(result) {
    console.log('DONE ', result);
    done();
  });
  
  function profileRequest(done, results) {
    logger.info('attempting to send profile request');
  
    task.dota2.profileRequest(task.accountId, true, function(err, profileData) {
      logger.info('received data for ' + profileData.playerName);
      
      if (!profileData || !profileData.gameAccountClient || !profileData.gameAccountClient.soloCompetitiveRank) return done();
      
      var str = '*** ' + profileData.playerName + ' ***\n' +
                profileData.gameAccountClient.soloCompetitiveRank + '\n';
      
      fs.appendFile('mmr.txt', str);
      
      User
        .query({ where: { accountId: task.accountId } })
        .fetch()
        .then(function(model) {
          if (model) {
            console.log('FOUND USER ', model);
          } else {
            console.log('NO USER');
            model = new User({
              accountId: task.accountId,
              username: profileData.playerName,
              soloRank: profileData.gameAccountClient.soloCompetitiveRank
            });
          }
          
          return done();
        });
      
    });
    
  }
  
};


module.exports = helpers;
