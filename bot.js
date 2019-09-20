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
const queue = new Map();

// when the client is ready, run this code
// this event will only trigger one time after logging in
bot.once('ready', () => {
	console.log('Ready!');
});

// login to Discord with your app's token
bot.login(auth.token);

// Scan the message
bot.on('message', message => {
	// Checks if the message was a command to the bot
	if(message.content.substring(0,1) == auth.prefix) {
		var args = message.content.substring(1).split(' ');
		var cmd = args[0];
		const playQueue = queue.get(message.guild.id);
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
					execute(message, playQueue, args[1]);
					
					/*message.member.voiceChannel.join()
						.then(connection => {
							console.log('Connected');
							message.delete();
							message.channel.send('```\nNow playing [TODO because I\'m lazy okay >:V]\n```');
							const stream = ytdl(args[1], { filter : 'audioonly' });
							broadcast.playStream(stream);
							const dispatcher = connection.playBroadcast(broadcast);
						})
						.catch(console.error);*/
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
			// ~skip
			case 'skip':
				if(!message.member.voiceChannel || !playQueue) {
					message.channel.send('Skip what? ΦΑΦ');
				} else {
					playQueue.connection.dispatcher.end();
				}
			break;
			// ~stop
			case 'stop':
				if(!message.member.voiceChannel) {
					message.channel.send('Stop what? ΦΑΦ');
				} else {
					playQueue.songs = [];
					playQueue.connection.dispatcher.end();
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

async function execute(message, playQueue, searchTerm) {
	const songInfo = await ytdl.getInfo(searchTerm);
	const song = {
		title: songInfo.title,
		url: songInfo.video_url,
	};
					
	// Checks if the serverQueue is already defined
	if(!playQueue) {
		// If the queue is nonexistent, create it
		const newQueue = {
			textChannel: message.channel,
			voiceChannel: message.member.voiceChannel,
			connection: null,
			songs: [],
			volume: 1,
			playing: true,
		};
		// Set the queue
		queue.set(message.guild.id, newQueue);
		// Push the song into the array
		newQueue.songs.push(song);
		message.channel.send('```\nAdded ' + song.title + ' to the queue ^ω^\n```');
		try {
			// Join the channel and set the connection to the current connection
			var connection = await message.member.voiceChannel.join();
			newQueue.connection = connection;
			// Play the songs
			play(message.guild, newQueue.songs[0], message.channel);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
		}
	} else {
		playQueue.songs.push(song);
		message.channel.send('```\nAdded ' + song.title + ' to the queue ^ω^\n```');
	}
}

/**
 * Plays a song that's passed into the parameter
 *
 * @param guild - the guild that the bot's playing for
 * @param song - the song that's going to be played
 * @param channel - the channel that the messages are sent to
 */
 function play(guild, song, channel) {
	 const playQueue = queue.get(guild.id);
	 if(!song) {
		 playQueue.voiceChannel.leave();
		 queue.delete(guild.id);
		 return;
	 }
	 
	 const stream = playQueue.connection.playStream(ytdl(song.url))
		.on('end', () => {
			channel.send(playQueue.songs[0].title + ' has ended ^ω^');
			playQueue.songs.shift();
			play(guild, playQueue.songs[0], channel);
		})
		.on('error', error => {
			console.error(error);
		});
	stream.setVolumeLogarithmic(playQueue.volume);
 }
