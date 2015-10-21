var http_request = require('request');
var config = require('config');
var async = require('async');

var host = config.get('server').host;
var port = config.get('server').port;

var MatchList = function(next) {
  this.matches = [];
  this.updateMatches(next);
};

AccountList.prototype.updateAccounts = function(next) {
  async.retry({ times: 5, interval: 10000 }, this.getAccounts, function(err, accounts) {
    if (err) throw err;
    this.accounts = accounts;
    next(null, this);
  });
};

AccountList.prototype.getAccounts = function(next) {
  var url = 'http://' + host + ':' + port + '/api/accounts?matches=false';
  
  request(url, function(err, response, body) {
    if (err) next(err);
    if (!body) next(new Error('Could not get account list.'));
    
    var results = JSON.parse(body);
    
    var accounts = results.map(function(account) {
      return new Account(account);
    });
    
    next(null, accounts);
  });
};

module.exports = AccountList;
