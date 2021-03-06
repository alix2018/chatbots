var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
//console.log("env:", process.env.port)
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "a6def656-d6ea-43b5-8084-8019cc690520",
    appPassword: "vkAbr4zcgGySoiTT1fBS0rF"
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    //console.log("message:", session.message)
    session.send("You said: %s", session.message.text);
});
