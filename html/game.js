var canvas=document.getElementById("myCanvas");
var canvasContainer=document.getElementById("canvasContainer");
var context=canvas.getContext("2d");
var client;

if(window.location.href.indexOf("local") < 0){
	client= new BinaryClient('ws://draws.frouk.me:9002');
}else{
	client= new BinaryClient('ws://localhost:9002');
}

client.on('stream', function(stream, meta){
	stream.on('data', function(data){
		if(data[0]=="chat"){
			$('#chat').append($('<li>').text(data[1]+":"+data[2]));
		}else if(data[0]=="gameEvent"){
			console.log(data);
			gameEvent(data);
		}else if(data[0]=="gameData"){
			console.log(data);
			gameData(data);
		}else{
			drawEnemy(data);
		}
    });
});

var offsetLeft=150;
function gameEvent(data){
	if(data[1]=="answer"){
		$('#answer').text(data[2]);
	}
}

var roundId="ss";
function gameData(data){
	var player=data[1];
	var res = player.split(";");
	$('#currentUsers').remove();
	$('#leftBox').append('<div id="currentUsers"></div>');
	for(var i=0;i<res.length-1;i++){
		var nameNscore = res[i].split(",");
		$('#currentUsers').append($('<li>').text(nameNscore[0]+':'+nameNscore[1]));
	}
	if(data[4]!=roundId){
		emptyCanvas();
		roundId=data[4];
	}
	if(data[3]){
		drawing(data[2]);
	}else{
		guessing(data[2]);
	}
}

function sendChat(chat){
	var array=new Array();
	array[0]="chat";
	array[1]=chat;
	client.send(array);
}
function setName(name){
	var array=new Array();
	array[0]="setName";
	array[1]=name;
	client.send(array);
}

function drawing(answer){
	$('#myCanvas').mousedown(function(e){
	  var mouseX = e.pageX - canvasContainer.offsetLeft;
	  var mouseY = e.pageY - canvasContainer.offsetTop;
	  paint = true;
	  addClick(e.pageX - canvasContainer.offsetLeft, e.pageY - canvasContainer.offsetTop);
	  redraw();
	});
	$('#myCanvas').mousemove(function(e){
	  if(paint){
	    addClick(e.pageX - canvasContainer.offsetLeft, e.pageY - canvasContainer.offsetTop, true);
	    redraw();
	  }
	});
	$(document).mouseup(function(e){
	  paint = false;
	});
	$('#myCanvas').mouseleave(function(e){
	  paint = false;
	});
	$('#answer').text(answer);
}

function guessing(help){
	paint=false;
	$('#myCanvas').unbind('mousedown');
	$('#myCanvas').unbind('mousemove');
	$('#myCanvas').unbind('mouseup');
	$('#myCanvas').unbind('mouseleave');
	$('#answer').text(help);
}

var offsetLeft=152;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
function emptyCanvas(){
	paint=false;
	clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
function addClick(x, y, dragging){
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
  var arraya=new Array();;
  arraya[0]=x;
  arraya[1]=y;
  arraya[2]=dragging;
  client.send(arraya);
}
function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  for(var i=0; i < clickX.length; i++) {
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}
function drawEnemy(data){
  clickX.push(data[0]);
  clickY.push(data[1]);
  clickDrag.push(data[2]);
  redraw();
}
