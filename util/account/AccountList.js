var http_request = require('request');
var config = require('config');
var async = require('async');
var Account = require('./Account');

var host = config.get('server').host;
var port = config.get('server').port;

var AccountList = function(accounts) {
  this.accounts = accounts;
};

AccountList.makeAccountList = function(next) {
  async.retry({ times: 5, interval: 10000 }, AccountList.getAccountsFromApi, function(err, accounts) {
    if (err) throw err;
    
    return next(null, new AccountList(accounts));
  });
};

AccountList.getAccountsFromApi = function(next) {
  var url = 'http://' + host + ':' + port + '/api/accounts?matches=false';
  
  http_request(url, function(err, response, body) {
    if (err) return next(err);
    if (!body) return next(new Error('Could not get account list.'));
    
    var results = JSON.parse(body);
    
    async.map(results, Account.makeAccount, function(err, accounts) {
      return next(null, accounts);
    });
    
  });
};

// Check each account for new matches then update
AccountList.prototype.updateAccounts = function() {
  
  // update accounts one at a time
  var queue = async.queue(AccountList.matchHistory);
  
  this.accounts.forEach((account) => {
    queue.push(account, function(err) {
      if (err) logger.error('Error contacting Steam API ' + err);
    });
  });
  
  return queue;
};

// When calling this be sure to put it in a queue
AccountList.matchHistory = function(account, done) {  
  account.getMatchHistory(function(err, matches) {
    if (err) return next(err);
    logger.info('Got matches');
    return done();
  });
};


module.exports = AccountList;
