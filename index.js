var Steam = require('steam');
var config = require('config');
var fs = require('fs');
var login = config.get('steam_login');
var readline = require('readline');

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var sentryFile;

steamClient.connect();

steamClient.on('connected', function() {
  steamUser.logOn({
    account_name: login.account_name,
    password: login.password,
    two_factor_code: login.guard_code
  });
});

steamClient.on('logOnResponse', function(res) {

  if (res.eresult === Steam.EResult.AccountLogonDenied) {
    rl.question('Steam Guard Code: ', function(code) {
      steamUser.logOn({
        account_name: login.account_name,
        password: login.password,
        two_factor_code: code
      });
    });
  }
  
  console.log(res);
});

steamClient.on('error', function(err) {
});

steamClient.on('sentry', function(sentryHash) {
  console.log('got a sentry');
  fs.writeFile('sentryfile', sentryHash, function(err) {
    if(err){
      console.log(err);
    } else {
      console.log('Saved sentry file hash as "sentryfile"');
    }
  });
});
