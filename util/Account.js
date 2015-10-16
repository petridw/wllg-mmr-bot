var logger = require('./logger');
var config = require('config');
var request = require('request');
var extend = require('lodash/object/extend');

var host = config.get('server').host;
var port = config.get('server').port;

function Account(account, match) {
  if (!account) return logger.error('Could not create account, valid info not provided.');
  this.accountID = account.accountID;
  this.steamID = account.steamID;
  this.username = account.username;
  this.currentMMR = account.currentMMR;
  this.lastPlayed = account.lastPlayed;
  this.match = match;
}

Account.prototype.setProps = function(newProps) {
  if (!newProps) return logger.error('Could not update props, props not provided.');
  extend(this, newProps);
  console.log('extended account', this);
};

Account.prototype.update = function(done) {
  
  var update_body = {
    accountID: this.accountID,
    steamID: this.steamID,
    username: this.username,
    currentMMR: this.currentMMR,
    lastPlayed: this.lastPlayed
  };
  
  if (this.match) {
    update_body.matchID = this.match.matchID;
    update_body.startTime = this.match.startTime;
    update_body.mmrChange = this.match.mmrChange;
    update_body.hero = this.match.hero;
  } else {
    logger.info(' UPDATING ACCOUNT ' + this.username + ' WITHOUT A NEW MATCH - IS THIS REALLY WHAT YOU WANT? ');
    logger.info(new Date());
  }
  
  console.log('sending PUT reqest to API:', update_body);
  
  var request_options = {
    url: 'http://' + host + ':' + port + '/api/account',
    method: 'PUT',
    json: true,
    body: update_body
  };
  
  request(request_options, function(err, res, body) {
    if (err) {
      logger.error('ERRP ERRP ERRP COULDNT UPDATE ACCOUNT', err);
      return done(err);
    }
    logger.info('Received response from API');
    logger.info(body);
    extend(this, JSON.parse(body));
    return done();
  });
};

module.exports = Account;
