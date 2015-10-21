var async = require('async');
var CronJob = require('cron').CronJob;
var AccountList = require('./account/AccountList');
var timer = require('config').get('cron');
  
function startCron() {
  
  logger.info('creating a new cron task (this should only happen once)');
  var queue;
    
  return new CronJob(timer, function() {
    logger.info('cron task started');
    
    if (queue && !queue.idle()) {
      logger.error('Match history queue still running when cron job starting. ' +
                   'Flushing queue, but something probably went wrong.');
      queue.kill();
    }
    
    // get accounts
    // For now just make a brand new account list every time (to be safe)
    // Should work if we just reuse the Account objects though
    AccountList.makeAccountList(function(err, accountList) {
      logger.info('Made account list.');
      queue = accountList.updateAccounts();
      
      queue.drain = function() {
        logger.info('Finished updating account histories.');
      }
    });
    
  }, null, true, 'America/Los_Angeles');
  
}

module.exports = startCron;
