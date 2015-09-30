var Steam = require('steam');
var Dota2 = require('dota2');
var SteamUser = require('steam-user');
var config = require('config');
var async = require('async');
var utils = require('./util/helpers');
var fs = require('fs');
var logger = require('./util/logger');

var sequelize = require('./util/sequelize');

var Account = require('./util/models/Account');
var Match = require('./util/models/Match');

Account.sync();
Match.sync();

// var steamClient = new Steam.SteamClient();
var client = new SteamUser();
var dota2 = new Dota2.Dota2Client(client.client, true);
var steamClient = client.client;

var q = async.queue(utils.getMMR, 5);
q.pause();

var login = config.get('steam_login');

if (fs.existsSync('mmr.txt')) {
  fs.writeFile('mmr.txt', '');
}

if (fs.existsSync('servers.json')) {
  servers = fs.readFile('servers.json', 'utf8', function(err, data) {
    var servers = JSON.parse(data);
    Steam.servers = servers;
  });
}

client.logOn({
  accountName: login.username, 
  password: login.password
});

client.on('error', function(err) {
  logger.error(err);
});

client.on('loggedOn', function(details) {
  logger.info('Logged on to Steam');
  
  client.setPersona(Steam.EPersonaState.Online, "novlovplovguy");
});

client.on('friendMessage', function(senderID, message) {
  logger.info('received message from ' + senderID);
  var accountID;
  
  // update MMR for steamID in the message
  try {
    accountID = dota2.ToAccountID(message);

    q.push({ accountID: accountID, dota2: dota2 }, function(err) {
      if (err) return logger.error(err);
      logger.info('finished processing ' + accountID);
    });
  } catch (err) {
    logger.error(err);
  }
});

client.on('friendRelationship', function(sid, relationship) {
  logger.info('friend request from ' + sid);
  if (relationship === Steam.EFriendRelationship.RequestRecipient) {
    // we got added! add them back!
    logger.info('adding them back...');
    client.addFriend(sid);
  }
});

steamClient.on('servers', function(newServers) {
  dota2.launch();
  
  logger.info('servers downloaded');
  
  fs.writeFile('servers.json', JSON.stringify(newServers));
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
  logger.info('profileData');
});
