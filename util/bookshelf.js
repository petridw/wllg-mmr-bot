var pg = require('pg');
var config = require('config');
var options = config.get('bookshelf');

var knex = require('knex')({
  client: 'pg',
  connection: options
});

var bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;
