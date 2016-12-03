var Room = function(roomId, maxPlayers, sendData, getWord) {
    this.roomId = roomId;
    this.maxPlayers = maxPlayers;
    this.playerData = {};
    this.state = 'EMPTY';
    this.sendData = sendData;
    this.drawId = 0;
    this.getWord = getWord;
    this.currentWord = "Waiting For Players";
    this.currentHelp = "Waiting For Players";
};

Room.prototype.addPlayer = function(id, name) {
    this.playerData[id] = [name, 0];
    if (this.getPlayers() > 1) {
        if (this.state != 'PLAYING') {
            this.state = 'PLAYING';
            this.nextRound();
            return;
        }
    } else {
        this.state = 'WAITING';
    }
    this.sendGameData();
};

Room.prototype.removePlayer = function(id) {
    delete(this.playerData[id]);
    if (this.getPlayers() < 1) {
        this.state = 'EMPTY';
    } else if (this.getPlayers() === 1) {
        this.state = 'WAITING';
    } else {
        if (id == this.drawId) {
            this.nextRound();
        }
    }
    this.sendGameData();
};

Room.prototype.getState = function(id) {
    return this.state;
};

Room.prototype.getPlayers = function() {
    return Object.keys(this.playerData).length;
};

// TODO: Need to sanitize data
Room.prototype.onNewData = function(senderId, data) {
    switch (data[0]) {
        case "chat":
            this.onNewChat(senderId, data[1]);
            break;
        case "setName":
            this.playerData[senderId][0] = data[1];
            this.sendGameData();
            break;
        default:
            this.onNewDraw(senderId, data);
    }
};

Room.prototype.onNewChat = function(senderId, message) {
    if (message.toUpperCase() != this.currentWord) {
        this.sendToAllOthers(senderId, ["chat", this.playerData[senderId][0], message]);
    } else {
        if(senderId != this.drawId) {
            for (clientId in this.playerData) {
                this.sendData(clientId, ["chat", "Server", this.playerData[senderId][0] + " Wins!"]);
            }
            this.playerData[senderId][1]++;
            this.nextRound();
        }
    }

};

Room.prototype.onNewDraw = function(senderId, drawData) {
    // Check if user is drawing
        /*
        */

    // Send chat
    this.sendToAllOthers(senderId, drawData);
};

Room.prototype.sendGameData = function() {
    var myArray = new Array();
	myArray[0] = "gameData";
	myArray[1] = "";
    for (clientId in this.playerData) {
        myArray[1] += this.playerData[clientId][0] + "," + this.playerData[clientId][1] + ";";
    }
	myArray[2] = this.currentHelp;
	myArray[3] = false;
	myArray[4] = 2;

    this.sendToAllOthers(this.drawId, myArray);

    if (this.playerData[this.drawId] === undefined) {
        return;
    }
    myArray[2] = this.currentWord;
    myArray[3] = true;

    this.sendData(this.drawId, myArray);
};

Room.prototype.sendToAllOthers = function(senderId, data) {
    for (clientId in this.playerData) {
        if (clientId != senderId) {
            this.sendData(clientId, data);
        }
    }
};

Room.prototype.nextRound = function() {

    // Get next drawID
    this.drawId = Object.keys(this.playerData)[(Object.keys(this.playerData).indexOf(this.drawId) + 1 )% this.getPlayers()];

    // Get new word
    this.currentWord = this.getWord();
    this.currentHelp = "";
    // Get help, should move it to wordManager

    for (var i = 0; i < this.currentWord.length - 1; i++) {
		if (this.currentWord.charAt(i) != " ") {
			this.currentHelp += "_ ";
		} else {
			this.currentHelp += "  ";
		}
	}
	this.currentHelp += "_";

    for (clientId in this.playerData) {
        this.sendData(clientId, ["chat", "server", "New Round"]);
    }

    this.sendGameData();
};

module.exports =  Room;
