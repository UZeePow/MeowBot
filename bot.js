/* Constant variables */
// require the discord.js module
const Discord = require('discord.js');
// require the auth file
const auth = require('./auth.json');
// require the request module
const request = require('request');
// play streams using ytdl-core
const ytdl = require('ytdl-core');
// create a new Discord client
const bot = new Discord.Client();
// stream constants
const streamOptions = { seek: 0, volume: 1 };
const broadcast = bot.createVoiceBroadcast();
// search on youtube constants
var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getChannel);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    forUsername: 'GoogleDevelopers'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  channels[0].id,
                  channels[0].snippet.title,
                  channels[0].statistics.viewCount);
    }
  });
}



// when the client is ready, run this code
// this event will only trigger one time after logging in
bot.once('ready', () => {
	console.log('Ready!');
});

// login to Discord with your app's token
bot.login(auth.token);

bot.on('message', message => {
	// Checks if the message was a command to the bot
	if(message.content.substring(0,1) == auth.prefix) {
		var args = message.content.substring(1).split(' ');
		var cmd = args[0];
		switch(cmd) {
			// ~cat
			case 'cat':
				request.get('https://thecatapi.com/api/images/get?format=src&type=png', {}, function(error, response, body) {
					if(!error && response.statusCode == 200) {
						message.channel.send(response.request.uri.href);
					} else {
						console.log(error);
					}
				});
			break;
			// ~help [commands]
			case 'help':
				if(args.length == 1) {
					message.author.send('Hi! I am Neko\'s bot, MeowBot!\nHere are a list of commands you can use.  For more information, type ~help [command]\n```diff\n+ cat\n+ ping\n+ roll [count]d(num)[+modifiers+...]\n```');
				} else {
					switch(args[1]) {
						case 'cat':
							message.author.send('```bash\n"cat"\n```\nPull up a random image of a cat. :3');
						break;
						case 'help':
							message.author.send('```bash\n"help"\n```\nYou need help.');
						break;
						case 'ping':
							message.author.send('```bash\n"ping"\n```\nChecks how quickly a message is sent back to you.');
						break;
						case 'roll':
							message.author.send('```bash\n"roll"\n```\n```diff\n- Usage: ~roll [count]d(num)[+modifiers+...]\n```\n```css\n[count (optional)]: The amount of times you want to roll the die\n[num (required)]: How many faces the die has\n[modifier(s) (optional]: Values to add on to the end; multiple modifiers can be added by consecutive +\'s\n```\nMake sure to not have any spaces in between, otherwise it won\'t work');
						break;
						default:
							message.author.send('Unknown command');
					}
				}
			break;
			// ~ping
			case 'ping':
				if(args.length == 1) {
					message.channel.send('pong');
				} else {
					var sentMsg = args[1];
					for(var i = 2; i < args.length; i++) {
						var sentMsg = sentMsg + ' ' + args[i];
					}
					message.channel.send('pong ' + sentMsg);
				}
			break;
			// ~play [audio]
			case 'play':
				if(!args[1]) {
					message.channel.send('No audio specified ΦΑΦ');
				} else if(!message.member.voiceChannel) {
					message.channel.send('You must be in a voice channel ΦΑΦ');
				} else {
					message.member.voiceChannel.join()
						.then(connection => {
							console.log('Connected');
							message.delete();
							message.channel.send('```\nNow playing [TODO because I\'m lazy okay >:V]\n```');
							const stream = ytdl(args[1], { filter : 'audioonly' });
							broadcast.playStream(stream);
							const dispatcher = connection.playBroadcast(broadcast);
						})
						.catch(console.error);
				}
			break;
			// ~roll [count]d(num)[+modifiers+...]
			case 'roll':
				if(args.length > 1) {
					var nums = args[1].split('d');
					var addExtra = args[1].split('+');
				
					if(nums.length == 2) {
						var num = parseInt(nums[1]);
						var count = nums[0];
						var sum = Math.floor((Math.random() * num) + 1);
						var numbers = '' + sum;
					
						if(count < 2) {
							if(addExtra.length > 1) {
								for(var i = 1; i < addExtra.length; i++) {
									numbers = numbers + ' + ' + addExtra[i].toString();
									sum += parseInt(addExtra[i]);
								}
								message.channel.send('= ' + numbers + ' = ' + sum);
							} else {
								message.channel.send('= ' + sum);
							}
							break;
						}
						// if count > 1
						for(var i = 1; i < count; i++) {
							var tmp = Math.floor((Math.random() * num) + 1);
							sum += tmp;
							numbers = numbers + ' + ' + tmp.toString();
						}
						for(var i = 1; i < addExtra.length; i++) {
							numbers = numbers + ' + ' + addExtra[i].toString();
							sum += parseInt(addExtra[i]);
						}
						message.channel.send(numbers + ' = ' + sum);
					}
				}
			break;
		}
	}
	// Checks if the message is mentioning the bot
	if(message.content.includes(bot.user.toString())) {
		if(message.author != bot.user) {
			message.channel.send('Don\'t @ me you mother fucker ' + message.author);
		}
	}
});

// Check to see if a stream ended
bot.on('end', () => {
	console.log('send');
	bot.voiceChannel.leave();
});
/*var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `~`
    if (message.substring(0, 1) == '~') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // ~ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
			// ~help
			case 'help':
				bot.sendMessage({
					to: userID,
					message: 'Testing'
				});
			break;
         }
     }
});*/