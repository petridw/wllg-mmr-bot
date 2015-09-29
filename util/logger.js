var winston = require('winston');

module.exports = logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true, 
      level: 'debug'
    }),
    new (winston.transports.File)({
      level: 'info', 
      timestamp: true, 
      filename: 'cratedump.log', 
      json: false
    })
  ]
});
