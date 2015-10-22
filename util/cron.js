var async = require('async');
var CronJob = require('cron').CronJob;
var AccountList = require('./account/AccountList');
var timer = require('config').get('cron');
  
function startCron(dota2, profile_card_queue) {
  
  logger.info('creating a new cron task (this should only happen once)');
  var match_history_queue;
    
  return new CronJob(timer, function() {
    logger.info('cron task started');
    
    if (match_history_queue && !match_history_queue.idle()) {
      logger.error('Match history queue still running when cron job starting. ' +
                   'Flushing queue, but something probably went wrong.');
      match_history_queue.kill();
    }
    
    if (profile_card_queue && !profile_card_queue.idle()) {
      logger.error('Profile queue still running when cron job starting. ' +
                   'Flushing queue, but something probably went wrong.');
      profile_card_queue.kill();
    }
    // get accounts
    // For now just make a brand new account list every time (to be safe)
    // Should work if we just reuse the Account objects though
    AccountList.makeAccountList(dota2, profile_card_queue, function(err, accountList) {
      logger.info('Made account list.');
      match_history_queue = accountList.updateAccounts();
      
      match_history_queue.drain = function() {
        logger.info('Finished updating account histories.');
      };
    });
    
  }, null, true, 'America/Los_Angeles');
  
}

module.exports = startCron;
