var Account = require('../account/Account');
var AccountList = require('../account/AccountList');

function friendEvents(client) {
    
  client.on('friendRelationship', function(sid, relationship) {
    logger.info('friend request from ' + sid);
    if (relationship === Steam.EFriendRelationship.RequestRecipient) {
      // we got added! add them back!
      logger.info('adding them back...');
      client.addFriend(sid);
    }
  });

  client.on('friendMessage', function(senderID, message) {
    logger.info('received message from ' + senderID);
    
    // message accepts account ID and then manually pushes it to profile queue
    
    // update MMR for steamID in the message
    // console.log('manually pushing ' + message + ' to profile queue');
    // var items = message.split(',');
    // 
    // if (items.length === 2) {
    //   profile_queue.push({ 
    //     accountID: parseInt(items[0]), 
    //     dota2: dota2, 
    //     match: { 
    //       matchID: items[1],
    //       startTime: items[2]
    //     }
    //   }, function(err) {
    //     if (err) return logger.error(err);
    //     logger.info('finished processing ' + items[0]);
    //   });
    // } else if (items.length === 1) {
    //   console.log(items[0]);
    //   
    //   var account = new Account(items[0]);
    //   
    //   match_history_queue.push(account);
    // }

  });
  
}

module.exports = friendEvents;
