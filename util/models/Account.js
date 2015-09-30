var Sequelize = require('sequelize');
var sequelize = require('./../sequelize');

var Account = sequelize.define('account', {
  accountID: {
    type: Sequelize.INTEGER,
    field: 'account_id',
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING
  },
  startingMMR: {
    type: Sequelize.INTEGER,
    field: 'starting_mmr'
  },
  currentMMR: {
    type: Sequelize.INTEGER,
    field: 'current_mmr'
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

module.exports = Account;
