#!/root/.nvm/versions/node/v16.9.1/bin node

const UPDATE_NAME = true;
const SLEEP_TIME_SECS = 60 * 60;
const SLEEP_TIME_REEL_SECS = 60;

const ARROW_UP = '\u{2B06}'; //'\u{1F607}';
const ARROW_DOWN = '\u{2B07}';
const ARROW_LEFTRIGHT = '\u{2194}';
const TRI_DOWN = '\u{1F53B}';
const TRI_UP = '\u{1F53A}';


//require('dotenv').config(); //initialize dotenv

import { config } from 'dotenv';
config();

//import { https } from 'https';
import axios from 'axios';
import { Low, JSONFile } from 'lowdb';
//const db = new Low('db.json')
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Read data from JSON file, this will set db.data content
await db.read()

//import { Low, JSONFile } from 'lowdb';
//const db = new Low(new JSONFile('file.json'))
//await db.read()
//await db.write()

import { Client, Intents } from 'discord.js';
//const Discord = require('discord.js'); //import discord.js

const client = new Client( { 
	intents: [
		Intents.FLAGS.GUILD_MESSAGES
	] //,
	//autoReconnect : true 
} ); //create new client

client.on('ready', onReady);


async function onReady() {
	console.log("Logged in as "+client.user.tag);
	
	var i = 0;
	while(true) {


		console.log( 'iteration: '+i+' '+Date() );
		//await sleep(60*60*1000);

		try {
			

			let data = await getData();
			data["i"] = i;
			//let newPrice = data["usd_price"];

			let oldData = db["data"];
			console.log( 'oldData: ' + oldData );
			
			if (oldData != null) {

				data["usd_price_old"] = oldData["usd_price"];
				data["usd_24h_vol_old"] = oldData["usd_24h_vol"];
				data["usd_market_cap_old"] = oldData["usd_market_cap"];
				data["usd_24h_change_old"] = oldData["usd_24h_change"];
				
				//let oldPrice = oldData["usd_price"]; 
				//data["usd_price_change"] = getSign( oldPrice, newPrice );

				//if (oldPrice > newPrice) data["usd_price_change"] = "1";
				//else if (oldPrice < newPrice) data["usd_price_change"] = "-1";
				//else data["usd_price_change"] = "0";

			}


			//let newPrice = data["usd_price"];

			db["data"] = data;
			// Write db.data content to db.json
			await db.write()

			await setData( data );

		}
		catch(e) {
			console.error( e );
		}

		//console.log( 'going to sleep...' );
		//await sleepms( SLEEP_TIME_SECS * 1000 );
		i++;
	}

	console.log('END');

}

function getSign( oldValue, newValue ) {
	if (oldValue == null) return 0;
	if (newValue == null) return 0;
 
	if (newValue > oldValue) return 1;
	else if (newValue < oldValue) return -1;
	return 0;
}


function getPlus( value ) {
	return value >= 0 ? '+'+value : value;
}

function getArrow( updown ) {
	if ( updown == 1 ) return TRI_UP; //ARROW_UP;
	else if ( updown == -1 ) return TRI_DOWN; //ARROW_DOWN;
	return "="; //ARROW_LEFTRIGHT;
}

function formatPrice( data ) {
	let s = 'CRO ' + data["usd_price"].toFixed( 4 ) + '$';
	s += ' ' + getArrow( getSign( data["usd_price_old"], data["usd_price"] ) );
	//s += ' ' + data["i"];
	return s;
}
function formatVolume( data ) {
	let s = 'VOL24h: ' + getNumberUnit( data["usd_24h_vol"] ) + '$';
	s += ' ' + getArrow( getSign( data["usd_24h_vol_old"], data["usd_24h_vol"] ) );
	//s += ' ' + data["i"];
	return s;
}
function formatMarketCap( data ) {
	let s = 'MCAP: ' + getNumberUnit( data["usd_market_cap"] ) + '$';
	s += ' ' + getArrow( getSign( data["usd_market_cap_old"], data["usd_market_cap"] ) );
	//s += ' ' + data["i"];
	return s;
}
function formatPriceChange( data ) {
	//let perc = data["usd_24h_change"] / data["usd_price"];
	let s = '%24h: ' + getPlus( data["usd_24h_change"].toFixed( 2 )  ) + '%';
	s += ' ' + getArrow( getSign( 0, data["usd_24h_change"] ) );
	//s += ' ' + data["i"];
	return s;
}

async function setData( data ) {
	console.log( 'setData()' );

	//const upArrow = '\u{1F607}';

	if ( data != null ) {
/*
		let i = data["i"];
		var cro = data["usd_price"];
		var vol24h = data["usd_24h_vol"];
			
		var scro = i+'CRO ' + cro.toFixed( 4 ) + '$';
		scro += ' ' + getArrow( getSign( data["usd_price_old"], data["usd_price"] ) );
		//if (data["usd_price_change"] == 1) scro += upArrow; 

		var svol24h = i+'Vol ' + getNumberUnit( vol24h );
		svol24h += ' ' + getArrow( getSign( data["usd_24h_vol_old"], data["usd_24h_vol"] ) );
		//svol24h += ARROW_LEFTRIGHT; 

		console.log( scro );
		console.log( svol24h );
*/
		try {
			if (UPDATE_NAME) await setUsername( client, formatPrice( data ) );
		}
		catch(e) {
			console.log( e.toString() );
		}		

		console.log( 'starting loop' );

		let elapsedSeconds = 0;
		let reel_step = 0;

		while( elapsedSeconds < SLEEP_TIME_SECS ) {

			await sleepms( SLEEP_TIME_REEL_SECS * 1000 ) ;
			elapsedSeconds += SLEEP_TIME_REEL_SECS;

			let s = formatPrice( data );
			if (reel_step == 1) s = formatPriceChange( data );
			else if (reel_step == 2) s = formatMarketCap( data );
			else if (reel_step == 3) s = formatVolume( data );

			console.log( 'change activity to: '+s );
			await setActivity( client, s /* + elapsedSeconds */ );

			reel_step++; 
			reel_step %= 4;
		
		}

		console.log( 'ending loop' );

		client.destroy();
		client.on('ready', () => {} );
		await client.login( process.env.CLIENT_TOKEN );

	}
	else {
		console.error( 'Data is null' );
	}

	console.log( 'setData() END' );
}

client.on('messageCreate', message => {
	console.log("receivd: "+message);
	if (message.content.includes('changeNick')) {
	        client.setNickname({nick: message.content.replace('changeNick ', '')});
	}
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token


async function setUsername(client, username) {
	await client.user.setUsername( username );
}

async function setActivity( client, activityName ) {
	await client.user.setActivity( activityName, { type: 'PLAYING' });
}

function sleepms( ms ) {
	  return new Promise((resolve) => {
		  setTimeout(resolve, ms);
	  });
}

function getNumberUnit( num ) {
    var units = ["M","B","T","Q"];
    var unit = Math.floor((num / 1.0e+1).toFixed(0).toString().length)
    var r = unit%3
    var x =  Math.abs(Number(num))/Number('1.0e+'+(unit-r)).toFixed(2)
    return x.toFixed(2) + units[Math.floor(unit / 3) - 2]
}

async function getData() {
	console.log( 'getData()' );
// https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true
/*
{
	  "crypto-com-chain": {
	      "usd": 0.195395,
	    "usd_market_cap": 4958661099.591702,
		    "usd_24h_vol": 135661910.14997914,
		    "usd_24h_change": 2.848722728463383
	  }
}
*/
//var url = 'https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true';

	var url = 'https://api.coingecko.com/api/v3/simple/price';
	var data = null;
	try {
		const res = await axios.get( url, {
    			params: {
    				ids: 'crypto-com-chain',
				vs_currencies: 'usd',
				include_market_cap: true,
				include_24hr_vol: true,
				include_24hr_change: true
    			}
  		});

	  	//console.log( res );
	  	console.log( res.status );

	  	if (res.status === 200) {
          		try {
				//data = res.data;
				data = {
					usd_price: res.data["crypto-com-chain"]["usd"],
					usd_market_cap: res.data["crypto-com-chain"]["usd_market_cap"],
					usd_24h_vol: res.data["crypto-com-chain"]["usd_24h_vol"],
					usd_24h_change: res.data["crypto-com-chain"]["usd_24h_change"]
				};

	        		//data = JSON.parse( res.data );
        			// data is available here:
          			console.log( JSON.stringify( data ) );
          		} 
			catch (e) {
                		console.log('Error parsing JSON: '+ res.data );
          		}
          	} 
	  	else {
          		console.log('Status:', res.statusCode);
          	}
  	}
	catch (error) {
      		// handle error
      		console.error( error );
	}

	return data;

/*
//const https = require('https')
const options = {
	  hostname: 'api.coingecko.com',
	  port: 443,
	  path: '/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
	  method: 'GET'
}

const req = https.request(options, res => {

	var json = '';
    	
	res.on('data', function (chunk) {
		json += chunk;
	});

	res.on('end', function () {
		if (res.statusCode === 200) {
			try {
				var data = JSON.parse( json );
				// data is available here:
				console.log( JSON.stringify( data ) );
			} 
			catch (e) {
	                        console.log('Error parsing JSON!');
			}
		} 
		else {
			console.log('Status:', res.statusCode);
		}
	}).on('error', function (err) {
		      console.log('Error:', err);
	});

})

req.end()
*/
}
