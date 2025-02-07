var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var sock = require('socket.io');
var morgan = require('morgan');
var fs = require('fs');
var randomstring = require('randomstring')

// *** myadmin Routers ***
var auth = require('./auth/authroutes.js');
var database = require('./database/databaseroutes.js');
var settings = require('./settings/settingsroutes.js');
var system = require('./system/systemroutes.js');
var home = require('./home/homeroutes.js');

module.exports = function myadmin(app, port) {
  'use strict';

  // ** Socket Connection
  var server = http.createServer(app);
  var io = sock(server);

  var expressListen = app.listen;
  app.listen = server.listen.bind(server);

  // ** Socket Controller
  require('./sockets/socketcontroller.js')(io);

  // ** Logs
  var accessLogStream = fs.createWriteStream(__dirname + '/serverlogs/access.log', {flags: 'a'});
  
  // ** Third party middleware
  app.use(morgan('dev', {
    stream:accessLogStream
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use('/mysql', express.static(__dirname + '/public'));
  // creates secret.js with a random string if it hasn't been initialized\\
  fs.readFile('./secret.js', function(err, data) {
    if (err) {
      var randomString = randomstring.generate();
      var contents = "module.exports = '" + randomString + "';";
      fs.writeFileSync(__dirname + '/secret.js', contents);
    }
    var secret = require('./secret.js');
    app.locals.secret = secret || 'shhhhhh';
  });
  
  // ** Routes
  app.use('/mysql/api/auth', auth);
  app.use('/mysql/api/db', database);
  app.use('/mysql/api/settings',settings);
  app.use('/mysql/api/system',system);
  app.use('/mysql/api/home',home);

  // ** Middleware
  return function myadmin(req,res,next) {
    next();
  };
};
