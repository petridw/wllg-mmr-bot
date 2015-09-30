var Sequelize = require('sequelize');
var sequelize = require('./../sequelize');

var Match = sequelize.define('match', {
  matchID: {
    type: Sequelize.STRING,
    field: 'match_id'
  },
  win: {
    type: Sequelize.BOOLEAN
  },
  mmrChange: {
    type: Sequelize.INTEGER,
    field: 'mmr_change'
  }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

module.exports = Match;
