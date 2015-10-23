var Account = require('../account/Account');
var AccountList = require('../account/AccountList');

function friendEvents(client, profile_card_queue, dota2) {
    
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
    
    if (message.charAt(0) === '!') {
      if (message.substring(1) === 'mmr') {
        Account.makeAccount(dota2, profile_card_queue, '' + dota2.ToAccountID(senderID), function(err, account) {
          if (err) return client.chatMessage(senderID, `Something effed up, maybe send this error message to David: ${err}`);
          account.getSoloMMR(function(err, soloMMR) {
            if (err) client.chatMessage(senderID, `Something effed up, maybe send this error message to David: ${err}`);
            else if (soloMMR !== -1) client.chatMessage(senderID, `Hi ${account.username}, your Solo MMR is ${soloMMR}`);
            else client.chatMessage(senderID, `Hi ${account.username}, I don't see a solo MMR listed on your profile.`);
          });

        });
      }
    } else {
      try {
        parseInt(message);
        Account.makeAccount(dota2, profile_card_queue, message, function(err, account) {
          account.getSoloMMR(function(err, soloMMR) {
            if (soloMMR !== -1) client.chatMessage(senderID, `Solo MMR for ${account.username} is ${soloMMR}`);
            else client.chatMessage(senderID, `Solo MMR is not displayed in ${account.username}'s profile`);
          });
        });
      } catch (err) {
        client.chatMessage(senderID, 'Please send a valid account ID');
      }
    }

  });
  
}

module.exports = friendEvents;
