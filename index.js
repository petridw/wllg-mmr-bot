var Steam = require('steam');
var Dota2 = require('dota2');
var config = require('config');
var fs = require('fs');
var readline = require('readline');
var async = require('async');
var utils = require('./util/helpers');
var logger = require('./util/logger');
var bookshelf = require('./util/bookshelf');
var client = new Steam.SteamClient();
var dota2 = new Dota2.Dota2Client(client, true);


var q = async.queue(utils.getMMR);
q.pause();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var login = config.get('steam_login');
var sentryfile;

if(fs.existsSync('sentryfile.' + login.username + '.hash')) {
  sentryfile = fs.readFileSync('sentryfile.' + login.username + '.hash');
}

if(fs.existsSync('mmr.txt')) {
  fs.writeFile('mmr.txt', '');
}

client.logOn({
  accountName: login.username, 
  password: login.password, 
  shaSentryfile: sentryfile // If null, a new Steam Guard code will be requested
});

client.on('error', function(e) {
  // Error code for invalid Steam Guard code
  if (e.eresult == Steam.EResult.AccountLogonDenied) {
    // Prompt the user for Steam Gaurd code
    rl.question('Steam Guard Code: ', function(code) {
      // Try logging on again
      client.logOn({
        accountName: login.username,
        password: login.password,
        authCode: code
      });
    });
  } else {
    logger.error('Steam Error: ' + e.eresult);
  }
});

client.on('sentry', function(sentry) {
  logger.info('Got new sentry file hash from Steam.  Saving.');
  fs.writeFile('sentryfile.' + login.username + '.hash', sentry);
});

client.on('loggedOn', function() {
  logger.info('Logged on to Steam');
  
  client.setPersonaName("novlovplov"); 
  client.setPersonaState(Steam.EPersonaState.Online);
  dota2.launch();
  
});

client.on('webSessionID', function(sessionid) {  
  var friends = Object.keys(client.friends);
    
  friends.forEach(function(friend){
    q.push({
      accountId: dota2.ToAccountID(friend),
      dota2: dota2
    }, function(err) {
      if (err) logger.error(err);
    });
  });
});

dota2.on('ready', function() {
  logger.info('GC ready');
  
  if (q.paused) {
    q.resume();
  }
  
});

dota2.on('unready', function() {
  logger.info('GC not ready');
    
  if (!q.paused) {
    q.pause();
  }
});

dota2.on('profileData', function(accountId, profileData) {
  logger.info('profileData event');
});
