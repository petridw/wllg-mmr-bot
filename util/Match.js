var logger = require('./logger');

function Match(match) {
  if (!match) return logger.error('match object not provided, no Match created.');
  this.matchID = '' + match.matchID;
  this.startTime = '' + match.startTime;
  this.accountID = '' + match.accountID;
  this.mmrChange = match.mmrChange;
  this.hero = match.hero;
}

Match.prototype.setProps = function(newProps) {
  for (var key in newProps) {
    this[key] = newProps[key];
  }
};

module.exports = Match;
