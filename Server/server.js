var express = require('express');
var app = express();
var currentTally = require('../Queries/tallyQuery.js').currentTally;
var snapshots = require('../Queries/tallyQuery.js').snapshots;
var db = require('../Schemas/config.js');
var path = require('path');

var port = process.env.PORT || 1111;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(path.join(__dirname, '../Client')));

app.listen(port, function() {
  console.log("We have started our server on port " + port);
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../Client', 'index.html'));
});

app.get('/tally', function(req, res) {
  currentTally('tally', function(data) {
    res.send(JSON.stringify(data));
  });
});

app.get('/total', function(req, res) {
  currentTally('totals', function(data) {
    res.send(JSON.stringify(data));
  });
});

app.get('/snapshots', function(req, res) {
  snapshots(function(snaps) {
    res.send(snaps);
  });
});
