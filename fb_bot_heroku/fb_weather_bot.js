const express = require('express');
const FBBotFramework = require('fb-bot-framework');
const apiai = require('apiai');
const fetch = require('node-fetch');
const path = require('path');

// Initialization
const app = express();
const bot = new FBBotFramework({
	page_token: "EAALdLyoY5iMBAIddmLh6kHpNJ6bZBZAZC1GmUItFPoHYZCmMagOzZAR4BCdCgaSfD6ssG7JyZALculLa4wvnEU3WXto0hoWhknvT5O7WCpZCOlbFdbZAAHoauKgz4HF0bKmkbDLlUl16y40ZBpu0dxMPHGOGckzK3hCH62zMSZAuEw5gZDZD",
  verify_token: "heroku_token"
});
const agent = apiai("291ec8ecde384312a9c7190faae3761f");

var reply = new String()
var jsonURL = new String()
var botAnswer = new String()
var count = 0
var temperature, latitude, longitude
var url = "https://immense-tor-25991.herokuapp.com"

// Setup Express middleware for /webhook
app.use('/webhook', bot.middleware());

// Set the right port
app.set('port', (process.env.PORT || 5000));
console.log('port:',process.env.PORT)

// Path for a weather picture: /weather/picture.png
app.use('/weather', express.static(__dirname + '/weather_pictures'));
// Path for a weather picture: /views/file.html
app.use('/views', express.static(__dirname + '/views'));

app.get('/', function(req, res) {
    res.send("Welcome")
});


// Display weather pictures
var weatherIcons = {
	"01d": url + "/weather/32.png",
	"02d": url + "/weather/30.png",
	"03d": url + "/weather/26.png",
	"04d": url + "/weather/25.png",
	"09d": url + "/weather/11.png",
	"10d": url + "/weather/39.png",
	"11d": url + "/weather/0.png",
	"13d": url + "/weather/13.png",
	"50d": url + "/weather/20.png"
}

// Send a card
var weatherCard = [
  {
    "title": "Weather",
    "image_url": url + "/weather/0.png",
    "subtitle": "Details about the weather",
    "buttons": [
      {
        "type":"web_url",
        "url":"http://openweathermap.org/city/",
        "title":"More details"
      },
			{
					"type":"web_url",
					"title":"Widget",
					"url": url + "/views/webview.html",
					"messenger_extensions": true,
					"webview_height_ratio": "tall",
					"fallback_url": url + "/views/webview.html"
			}
    ]
  }
];

// Send a button
var menuButtons = [
    {
        "type":"web_url",
				"title":"menuButtons",
        "url": url + "/views/webview.html",
				"messenger_extensions": true,
				"webview_height_ratio": "compact",
				"fallback_url": url + "/views/webview.html"
    }
];

// Setup listener for incoming messages
bot.on('message', (userId, message) => {

	console.log('User text:', message)

  // Send text content to the right Api.ai agent
  var request = agent.textRequest(message, {
      sessionId: 'ba658112b8044f2e992d1a21f5945303'
  })

  // Reset the count each new message from the bot (in the case the bot sends several answers)
  count = 0

  // Api.ai agent answers
  request.on('response', (response) => {

    console.log('answer1:', response.result.fulfillment)

    // We scan the answers array from api.ai, just Api.ai default or Facebook responses
    while (count < response.result.fulfillment.messages.length) {

			botAnswer = response.result.fulfillment.messages[count]

      if ( (botAnswer.platform == undefined) ||
           (botAnswer.platform == "facebook") ) {
        console.log('platform:', botAnswer.platform)
        // If the answer is a custom payload (type = 4)
        if ((botAnswer.type == 4)) {
          console.log('answer:', botAnswer.payload)
          json = botAnswer.payload.facebook.attachment.payload.text

          jsonToCard(userId, json)
        }

        // If the answer is a text response (type = 0)
        else if (botAnswer.type == 0) {

          console.log('bot text:', botAnswer.speech)

					// Ask for the city and send a location button
					if (botAnswer.speech == "In which city?") {
						bot.sendLocationRequest(userId, botAnswer.speech)
					}

					// All other answers from the bot
					else {
	          reply = botAnswer.speech
	          bot.sendTextMessage(userId, reply)

						/*
						bot.sendListMessage(userId, elements)
						console.log('elements:', elements)
						bot.sendListMessage(userId, elements, function(){console.log("ARGS ", arguments)})

						var text = "Button Title"
						console.log('menuButtons:', menuButtons)
						bot.sendButtonMessage(userId, text, menuButtons, function(){console.log("ARGS ", arguments)});
						*/

					}

        }
      }

    // Next bot answer
    count++
    }
  });

  request.on('error', (error) => {
      console.log('errooor:', error);
  });

  request.end();

})

// When the user send his location
bot.on('attachment', function(userId, attachment) {
	console.log('attachment:', attachment)

	if (attachment[0].type == "location") {
	  latitude = attachment[0].payload.coordinates.lat;
	  longitude = attachment[0].payload.coordinates.long;

	  json = "http://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&appid=9393e4c87b6070958c8611b9f5211c48"
	  jsonToCard(userId, json)
	}

})

// Make Express listening
app.listen(app.get('port'), () => {
  console.log('Started on port', app.get('port'))
})

// Function to retrieve a json from an URL and return a weather card with all the information
function jsonToCard(userId, json) {

  // Retrieve the weather JSON file from the url
  fetch(json)
    .then( (res) => {
      return res.json();
    }).then( (json) => {
      console.log(json);

      // Conversion from Kelvin to Celsius
      temperature = parseFloat(json.main.temp-273.15).toFixed(0);
			//app.use(express.static(__dirname + '/weather_pictures'));
			//app.use("/static", express.static("/weather_pictures"))

      // Bot answer about the weather
      weatherCard[0].title = "Weather in " + json.name
      weatherCard[0].image_url = weatherIcons[json.weather[0].icon]
      weatherCard[0].subtitle = json.weather[0].description + " with a temperature of " + temperature + "°C"
      weatherCard[0].buttons[0].url = "http://openweathermap.org/city/" + json.id

			console.log('weatherCard:', weatherCard)

      // Send a card with a picture, details and website link
      bot.sendGenericMessage(userId, weatherCard);
    })
}
