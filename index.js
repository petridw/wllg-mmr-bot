var Steam = require('steam');
var Dota2 = require('dota2');
var SteamUser = require('steam-user');
var config = require('config');
var async = require('async');
var utils = require('./util/helpers');
var logger = require('./util/logger');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var request = require('request');
var Account = require('./util/Account');
var Match = require('./util/Match');


// var steamClient = new Steam.SteamClient();
var client = new SteamUser();
var dota2 = new Dota2.Dota2Client(client.client, true);
var steamClient = client.client;

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
  
  // update MMR for steamID in the message
  console.log('manually pushing ' + message + ' to profile queue');
  var items = message.split(',');

  if (items.length === 2) {
    profile_queue.push({ 
      accountID: parseInt(items[0]), 
      dota2: dota2, 
      match: { 
        matchID: items[1],
        startTime: items[2]
      }
    }, function(err) {
      if (err) return logger.error(err);
      logger.info('finished processing ' + items[0]);
    });
  } else if (items.length === 1) {
    console.log(items[0]);
    profile_queue.push({
      account: {
        accountID: items[0]
      },
      dota2: dota2
    });
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
  logger.info('servers downloaded, launching dota 2');
  
  dota2.launch();
});

dota2.on('ready', function() {
  logger.info('GC ready');
    
  if (profile_queue.paused) {
    profile_queue.resume();
  }
  
  async.retry({ times: 5, interval: 1000 }, getAccounts, function(err, results) {
    if (err) return logger.error('Could not retrieve accounts after 5 attempts. Ensure api is up and running.');
    startCron(results);
  });
});

dota2.on('unready', function() {
  logger.info('GC not ready');
  
  // Don't send any requests to dota2 when GC offline
  if (!profile_queue.paused) {
    profile_queue.pause();
  }
});

dota2.on('profileData', function(accountId, profileData) {
  logger.info('profileData');
  console.log(profileData);
});

function getAccounts(done) {
  var host = config.get('server').host;
  var port = config.get('server').port;
  
  request('http://' + host + ':' + port + '/api/accounts', function(err, response, body) {
    if (err) {
      logger.error(err);
      return done(err);
    }
    if (!body) {
      logger.error('No account list received');
      return done(new Error('No account list received.'));
    }
    
    var results = JSON.parse(body);
    
    var accounts = results.map(function(account) {
      return new Account(account);
    });
    
    done(null, accounts);
  });
}

function startCron(accounts) {
  var job = new CronJob('00 00,10,20,30,40,50 * * * *', function() {
    logger.info('cron task started');
    
    // create queue with concurrency of 1 so we don't make too many requests to steam at once
    var match_history_queue = new async.queue(matchHistory);
    
    accounts.forEach(function(account) {
      match_history_queue.push(account);
    });
    
  }, function() {
    logger.info('cron task complete at ' + moment());
  }, true, 'America/Los_Angeles');
}

function matchHistory(account, done) {
  
  var match_history_url = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/' +
                          '?key=' + config.get('steam').api_key +
                          '&account_id=' + account.accountID.substring(1);
  
  request(match_history_url, function(err, response, body) {
    
    if (err) {
      logger.error(err);
      return done();
    }
    
    body = JSON.parse(body);

    if (!body || !body.result || !body.result.status) {
      logger.error('No valid match data received.', body);
      return done();
    }
    
    var lastMatch = body.result.matches[0];
    
    var match = new Match({
      matchID: lastMatch.match_id,
      startTime: parseInt(lastMatch.start_time) * 1000,
      accountID: account.accountID,
      hero: getHero(lastMatch.players, account.accountID)
    });

    if (!account.lastPlayed || moment(parseInt(match.startTime)).isAfter(moment(account.lastPlayed))) {
      logger.info('Updating ' + account.username + ' because they have a new match');
      
      profile_queue.push({
        account: account,
        dota2: dota2,
        match: match
      });
    } else {
      if (account.username === "Root Beer Guy") {
        logger.info('not updating root beer guy');
        logger.info('lastPlayed', moment(account.lastPlayed).format('MMMM Do YYYY, h:mm:ss a'));
        logger.info('lastMatch', moment(parseInt(match.startTime)).format('MMMM Do YYYY, h:mm:ss a'));
        logger.info('matchType', lastMatch.lobby_type);
      }
    }
    
    done();
  });
}

function getHero(array, accountID) {
  for (var i = 0; i < array.length; i ++) {
    if ('_' + array[i].account_id === accountID) {
      return array[i].hero_id;
    }
  }
  return -1;
}
