var connect = require('connect');
var serveStatic = require('serve-static');
var BinaryServer = require('binaryjs').BinaryServer;

connect().use(serveStatic('html')).listen(9003);
var server = BinaryServer({port: 9002});

var connectedPlayer=0;
var waitingForPlayer=true;
server.on('connection', function(client) {
  console.log("new connection...");
  console.log(client.id);
	client.username="User"+client.id;
  connectedPlayer++;
  RoundPlayers.push({clientObject:client, score:0});
  if(waitingForPlayer){
    if(connectedPlayer>1){
        waitingForPlayer=false;
        nextRound();
    }
  }else{
      sendGameData();
  }

  client.on('stream', function(stream, meta){
  	stream.on('data', function(data){
  		if(data[0]=="chat"){
  			sendChat(client,data[1]);
  		}else if(data[0]=="setName"){
  			client.username=data[1];
        sendGameData();
  		}else{
  			sendDraw(client,data);
  		}
  	});
  });

  client.on('close', function(){
    connectedPlayer--;
    for(var id=0;id<RoundPlayers.length;id++){
      if(RoundPlayers[id].clientObject==client){
        RoundPlayers.splice(id, 1);
        if(client==currentDrawer){
          currentDrawerID--;
          nextRound();
        }else{
          sendGameData();
        }
      }
    }
  });

})

function sendToClient(client,data){
  try{
    client.send(data);
  }catch (err){
    console.log("Error sending data to user.");
  }
}

var serverChat=new Object();
serverChat.username="Server";
function sendChat(client,chat){
	if(chat.toUpperCase()!=currentWord){
		console.log(client.username+": "+chat);
		var array=new Array();
		array[0]="chat";
		array[1]=client.username;
		array[2]=chat;
		for(var id in server.clients){
			if(server.clients.hasOwnProperty(id)){
				var otherClient = server.clients[id];
				if(otherClient != client){
          sendToClient(otherClient,array);
				}
			}
		}
	}else{
		if(client!=currentDrawer)finishRound(client);
	}
}

function sendDraw(client,draw){
  if(client!=currentDrawer) return;
	for(var id in server.clients){
		if(server.clients.hasOwnProperty(id)){
			var otherClient = server.clients[id];
			if(otherClient != client){
        sendToClient(otherClient,draw);
			}
		}
  }
}

var RoundPlayers=new Array();
var currentDrawerID=0;
var currentDrawer;
var roundId="RandomID";
var currentWord="FROUK";
var currentHelp="F _ _ _ _";

var wordList=['DD'];
var wordListBackup=['DD'];
var fs = require('fs');
function initWordList(){
  fs.readFile('wordList', function (err, logData) {
    if (err) throw err;
    var text = logData.toString();
    wordList = text.split('\n');
    wordList.splice(wordList.length-1,1);

    //shuffle wordList
    var counter = wordList.length, temp, index;
    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        counter--;
        temp = wordList[counter];
        wordList[counter] = wordList[index];
        wordList[index] = temp;
    }
    for(var i=0;i<wordList.length;i++){
      wordListBackup[i]=wordList[i];
      console.log(wordListBackup[i]);
    }
  });

}
initWordList();

/*
function initRound(){
  currentWord=wordList.pop();
  currentHelp="";
  console.log(currentWord);
  for (var i=0;i<currentWord.length-1;i++){
    if(currentWord.charAt(i)!=" "){
      currentHelp+="_ ";
    }else{
      currentHelp+="  ";
    }
  }
  currentHelp+="_";
  RoundPlayers=new Array();
  for(var id in server.clients){
    if(server.clients.hasOwnProperty(id)){
      RoundPlayers.push({clientObject:server.clients[id], score:0});
    }
  }
  currentDrawer=RoundPlayers[currentDrawerID].clientObject;
  roundId=Math.random().toString(36).substring(5);
  startRound();
}
*/

function nextRound(){
  if(RoundPlayers.length<2){
    waitingForPlayer=true;
    sendGameData();
    return;
  }
  if(wordList.length<1){
    for(var i=0;i<wordListBackup.length;i++){
      wordList[i]=wordListBackup[i];
    }
  }
  currentWord=wordList.pop();
  currentHelp="";
  console.log(currentWord);
  for (var i=0;i<currentWord.length-1;i++){
    if(currentWord.charAt(i)!=" "){
      currentHelp+="_ ";
    }else{
      currentHelp+="  ";
    }
  }
  currentHelp+="_";
  currentDrawerID++;
  if(currentDrawerID>=RoundPlayers.length){
    currentDrawerID=0;
  }
  currentDrawer=RoundPlayers[currentDrawerID].clientObject;
  roundId=Math.random().toString(36).substring(7);
  startRound();
}

function startRound(){
  sendGameData();
}

function finishRound(client){
  console.log("Finished round.");
  sendChat(serverChat,client.username+" WINS!");
  for(var i=0;i<RoundPlayers.length;i++){
    if(RoundPlayers[i].clientObject==client){
      RoundPlayers[i].score++;
      break;
    }
  }
  nextRound();
}

function sendGameData(){
  var myArray=new Array();
  myArray[0]="gameData";
  myArray[1]="";
  for(var id=0;id<RoundPlayers.length;id++){
    myArray[1]+=RoundPlayers[id].clientObject.username+","+RoundPlayers[id].score+";";
  }
  myArray[2]=currentHelp;
  myArray[3]=false;
  myArray[4]=roundId;
  for(var id in server.clients){
		if(server.clients.hasOwnProperty(id)){
		  if(server.clients[id]==currentDrawer){
		    var myArray2=new Array();
		    myArray2[0]="gameData";
		    myArray2[1]=myArray[1];
		    myArray2[2]=currentWord;
		    myArray2[3]=true;
		    myArray2[4]=roundId;
        sendToClient(currentDrawer,myArray2);
		  }else{
		    var otherClient = server.clients[id];
        sendToClient(otherClient,myArray);
		  }
		}
  }
}
