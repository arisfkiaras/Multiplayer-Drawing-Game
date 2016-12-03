var Room = require('./room.js');
var wordList = require('./wordManager.js').getWord;

var connect = require('connect');
var serveStatic = require('serve-static');
var BinaryServer = require('binaryjs').BinaryServer;

connect().use(serveStatic('html')).listen(9003);
var server = BinaryServer({port: 9002});


var sendData = function (id, data) {
	clients[id].send(data);
};

var singleRoom = new Room(1, 4, sendData, wordList);

var clients = [];

server.on('connection', function(client) {
	console.log("New connection..." + client.id);

    clients[client.id] = client;

	singleRoom.addPlayer(client.id, "Random" + client.id + "Name");

	client.on('stream', function(stream, meta) {
		stream.on('data', function(data) {
            singleRoom.onNewData(client.id, data);
		});
	});

	client.on('close', function(){
		singleRoom.removePlayer(client.id);
		console.log(client.id + "Closed");
	});

})
