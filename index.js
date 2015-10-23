var Steam = require('steam');
var Dota2 = require('dota2');
var SteamUser = require('steam-user');
var config = require('config');
var async = require('async');
var logger = require('./util/logger');
var once = require('./util/helpers/once');
var startCron = once(require('./util/cron'));
var friendEvents = require('./util/events/friends.js');
var profile_card_queue = async.queue(require('./util/helpers/getProfileCard'));

var client = new SteamUser();
var steamClient = client.client;
var dota2 = new Dota2.Dota2Client(steamClient, true);

// Keep profile_card_queue paused until Game Coordinator is ready to receive requests
profile_card_queue.pause();

var login = config.get('steam_login');

client.logOn({
  accountName: login.username, 
  password: login.password
});

client.on('error', function(err) {
  logger.error(err);
  throw err;
});

client.on('loggedOn', function(details) {
  logger.info('Logged on to Steam');
  
  client.setPersona(Steam.EPersonaState.Online, "novlovplovguy");
});

steamClient.on('servers', function(newServers) {
  logger.info('servers downloaded, launching dota 2');
  
  dota2.launch();
});

dota2.on('ready', function() {
  logger.info('GC ready');
    
  if (profile_card_queue.paused) profile_card_queue.resume();
  
  startCron(dota2, profile_card_queue);
});

dota2.on('unready', function() {
  logger.info('GC not ready');
  
  // Don't send any requests to dota2 when GC offline
  if (!profile_card_queue.paused) profile_card_queue.pause();
  
});

dota2.on('profileCardData', function(accountId, profileCardData) {
  logger.info('profileCardData');
  console.log(profileCardData);
  
});

friendEvents(client, profile_card_queue, dota2);
