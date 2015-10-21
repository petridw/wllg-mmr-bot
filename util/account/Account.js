var config = require('config');
var http_request = require('request');
var extend = require('lodash/object/extend');
var moment = require('moment');
var async = require('async');
var Match = require('../match/Match');
var fs = require('fs');

var steam_key = config.get('steam').api_key;

var host = config.get('server').host;
var port = config.get('server').port;

function Account(account, next) {
  this.accountID = account.accountID;
  this.steamID = account.steamID;
  this.username = account.username;
  this.currentMMR = account.currentMMR;
  this.lastPlayed = account.lastPlayed;
}

Account.makeAccount = function(account, next) {
  if (!account) throw new Error('Could not create account, valid info not provided.');
  if (typeof account === 'string') {
    // make new account with account id
    var accountID = account.charAt(0) === '_' ? account : '_' + account;
    
    Account.getAccountInfo(function(err, result) {
      if (err) throw err;
      logger.info('makeAccount calling done with new Account');
      return next(null, new Account(result));
    });
  } else {
    return next(null, new Account(account));
  }
};

Account.prototype.setProps = function(newProps) {
  if (!newProps) return logger.error('Could not update props, props not provided.');
  extend(this, newProps);
};

Account.prototype.updateAPI = function(done) {
  
  var update_body = {
    accountID: this.accountID,
    steamID: this.steamID,
    username: this.username,
    currentMMR: this.currentMMR,
    lastPlayed: this.lastPlayed
  };
    
  var request_options = {
    url: 'http://' + host + ':' + port + '/api/account',
    method: 'PUT',
    json: true,
    body: update_body
  };
  
  http_request(request_options, function(err, res, body) {
    if (err) {
      logger.error('ERRP ERRP ERRP COULDNT UPDATE ACCOUNT', err);
      return done(err);
    }

    return done(null, this);
  });
};

Account.getAccountInfo = function(accountID, next) {
  var url = 'http://' + host + ':' + port + '/api/account/' + accountID + '?matches=false';
  
  http_request.get(url, function(err, response, body) {
    if (err) throw err;
    
    var account = JSON.parse(body);
    console.log('Got account info:');
    next(null, account);
  });
};

// Call this from a concurrency queue to avoid getting rate limited
Account.prototype.getMatchHistory = function(next) {
  var url = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/' +
            '?key=' + steam_key +
            '&account_id=' + this.accountID.substring(1);
  
  http_request.get(url, (err, response, body) => {
    if (err) return next(err);
    
    var matches = JSON.parse(body).result.matches;
    
    this.resolveMatches(matches);
    
    return next(null, matches);
    
  });
};

// Check for changes and update account MMR if so
Account.prototype.resolveMatches = function(matches) {
  var match;
  var newMatches = [];
  
  for (var i = 0; i < matches.length; i ++) {
    match = new Match(matches[i]);
    
    if (moment(match.startTime).isAfter(this.lastPlayed)) {
      newMatches.push(match);
    } else {
      // Matches are in order so just break as soon as one is before our last played
      break;
    }
  }
  
  var rankedMatches = newMatches.filter((match) => {
    return (match.lobby_type === 7);
  }, this);
  
  if (rankedMatches.length > 1) {
    logger.error(`More than 1 new ranked matches. MMR changes will need to be
                  manually reconciled. See missedMatches.json`);
    rankedMatches.forEach((match) => {
      fs.appendFile(__dirname + '../missedMatches.txt', match);
      
      // TODO: Now update account with new matches
    });
  } else if (rankedMatches.length === 1) {
    // TODO:  Now update account with new match    
  }
  
  logger.info(`Found ${newMatches.length} new matches and ${rankedMatches.length} ` +
              `new ranked matches for ${this.username}`);
  
};

module.exports = Account;
