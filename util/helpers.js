var helpers = {};
var logger = require('./logger');

helpers.getMMR = function getMMR(task, done) {
  logger.info('in queue, processing player ' + task.accountId);
    
  task.dota2.profileRequest(task.accountId, true, function(err, profileData) {
    logger.info('received data for ' + profileData.playerName);
    
    if (!profileData || !profileData.gameAccountClient || !profileData.gameAccountClient.soloCompetitiveRank) return done();
    
    var str = '*** ' + profileData.playerName + ' ***\n' +
              profileData.gameAccountClient.soloCompetitiveRank + '\n';
    
    fs.appendFile('mmr.txt', str);
    
    done();
  });
};

module.exports = helpers;
