var Steam = require('steam');
// var SteamUser = require('steam-user');
var Dota2 = require('dota2');

var config = require('config');
var fs = require('fs');
var winston = require('winston');
var readline = require('readline');

var login = config.get('steam_login');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var sentryfile;
if(fs.existsSync('sentryfile.' + login.username + '.hash')) {
  sentryfile = fs.readFileSync('sentryfile.' + username + '.hash');
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true, 
      level: 'debug'
    }),
    new (winston.transports.File)({
      level: 'info', 
      timestamp: true, 
      filename: 'cratedump.log', 
      json: false
    })
  ]
});

var client = new Steam.SteamClient();
// var client = new SteamUser(steam);
// var steamUser = new SteamUser(client);
// var steamFriends = new Steam.SteamFriends(steam);
var dota2 = new Dota2.Dota2Client(client, true);

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
  
  client.setPersonaName("novlovplovinator"); 
  client.setPersonaState(Steam.EPersonaState.Online); 
});

client.on('webSessionID', function(sessionid) {
  logger.info('web session');
  // trade.sessionID = sessionid; // Share the session between libraries
  // 
  // client.webLogOn(function(cookie) {
  //   cookie.forEach(function(part) { // Share the cookie between libraries
  //     trade.setCookie(part.trim()); // Now we can trade!
  //   });
  //   logger.info('Logged into web');
  //   // No longer appear offline
  //   client.setPersonaState(steam.EPersonaState.LookingToTrade); 
  // });
});
