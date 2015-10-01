var Steam = require('steam');
var Dota2 = require('dota2');
var SteamUser = require('steam-user');
var config = require('config');
var async = require('async');
var utils = require('./util/helpers');
var logger = require('./util/logger');


// var steamClient = new Steam.SteamClient();
var client = new SteamUser();
var dota2 = new Dota2.Dota2Client(client.client, true);
var steamClient = client.client;

console.log(dota2.ToSteamID('76180485'));

// Create queue with concurrency of 1 for looking up profiles
// Keep queue paused until dota2 'ready' event has fired
var profile_queue = async.queue(utils.getMMR);
profile_queue.pause();

var login = config.get('steam_login');

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

    profile_queue.push({ accountID: accountID, dota2: dota2 }, function(err) {
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
  logger.info('servers downloaded, launched dota 2');
  
  dota2.launch();
});

dota2.on('ready', function() {
  logger.info('GC ready');
    
  if (profile_queue.paused) {
    profile_queue.resume();
  }
});

dota2.on('unready', function() {
  logger.info('GC not ready');
    
  if (!profile_queue.paused) {
    profile_queue.pause();
  }
});

dota2.on('profileData', function(accountId, profileData) {
  logger.info('profileData');
});
