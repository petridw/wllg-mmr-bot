var http_request = require('request');
var config = require('config');

var steam_key = config.get('steam').api_key;

function Match(match) {
  this.matchID = match.match_id;
  this.startTime = parseInt(match.start_time) * 1000;
  this.players = match.players;
  this.duration = match.duration;
  this.hero = null;
  this.mmrChange = null;
  this.accountID = null;
}

Match.prototype.save = function(done) {
  if (!this.hero || !this.mmrChange || !this.accountID) throw new Error('Cannot update Match without account information!');
  
  var update_body = {
    matchID: this.matchID,
    startTime: this.startTime,
    accountID: this.accountID,
    mmrChange: this.mmrChange,
    hero: this.hero
  };
    
  var request_options = {
    url: 'http://' + host + ':' + port + '/api/match',
    method: 'POST',
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

Match.prototype.setHero = function(accountID) {
  for (var i = 0; i < this.players.length; i ++) {
    if ('_' + this.players[i].account_id === accountID) {
      this.hero = hero_id;
      return hero_id;
    }
  }
  return -1;
};

Match.makeMatch = function(match, next) {
  if (typeof match === 'string') {
    // get match history from id
    Match.getMatchInfo(match, function(err, result) {
      if (err) throw err;
      logger.info('Making match.');
      return next(null, new Match(result));
    });
  } else {
    return next(null, new Match(match));
  }
};

Match.getMatchInfo = function(matchID, next) {
  var url = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/V001/' +
                       '?match_id=' + matchID + 
                       '&key=' + steam_key;

  http_request.get(url, function(err, response, body) {
    if (err) throw err;
    
    var match = JSON.parse(body).result;
    logger.info('Got match info.');
    
    next(null, match);
  });
};

module.exports = Match;
