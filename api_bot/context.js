'use strict';

var apiai = require("apiai");

var app = apiai("291ec8ecde384312a9c7190faae3761f");

var options = {
    sessionId: 'ba658112b8044f2e992d1a21f5945303'
};

var request = app.getContextsRequest(options);

request.on('response', function(response) {
    response = [
      { name: "contextName" }
    ]
    console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();

var requestSingle = app.getContextsRequest(options, 'contextName');

requestSingle.on('response', function(response) {
    console.log(response);
});

requestSingle.on('error', function(error) {
    console.log(error);
});

request.end();
