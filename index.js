var Steam = require('steam');
var Dota2 = require('dota2');
var config = require('config');
var fs = require('fs');
var winston = require('winston');
var readline = require('readline');


var client = new Steam.SteamClient();
var dota2 = new Dota2.Dota2Client(client, true);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var login = config.get('steam_login');
var sentryfile;
var friends;

if(fs.existsSync('sentryfile.' + login.username + '.hash')) {
  sentryfile = fs.readFileSync('sentryfile.' + login.username + '.hash');
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
  
  client.setPersonaName("novlovplovguy"); 
  client.setPersonaState(Steam.EPersonaState.Online);
  dota2.launch();
  
});

client.on('webSessionID', function(sessionid) {
  logger.info('friends');
  
  friends = Object.keys(client.friends);
    
  dota2.on('ready', function() {
    logger.info('GC ready');
    
    for (var i = 5; i < friends.length ; i ++) {
      dota2.profileRequest(dota2.ToAccountID(friends[i]), true);      
    }
  });
});

dota2.on('profileData', function(accountId, profileData) {
  console.log('***', profileData.playerName, '***');
  console.log(profileData.gameAccountClient.soloCompetitiveRank);
  console.log('\n');
});
