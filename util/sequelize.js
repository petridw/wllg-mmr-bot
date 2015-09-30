var pg = require('pg');
var config = require('config');
var Sequelize = require('sequelize');

var login = config.get('sequelize');

var sequelize = new Sequelize(login.database, login.username, login.password, {
  host: login.host,
  dialect: 'postgres',
  port: login.port,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

module.exports = sequelize;
