var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var messages = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function filterMessage(message){
	return  {id: message.id, txt: message.txt, yesVotes: message.yesVotes.length, noVotes: message.noVotes.length};
}

io.on('connection', function(socket){
  var filteredMessages = [];  
  var allowed = false;
  setInterval(function () {
		allowed = true;
	  }, 5000); 
  for(var i in messages){
	  filteredMessages.push(filterMessage(messages[i]));
  }
  socket.emit('messages', filteredMessages);
	
  socket.on('chat message', function(msg){
    if(!allowed){
		socket.emit('spam');
		return;
	}
	  var message = {id: messages.length, txt: msg, yesVotes: [], noVotes: []};
	 allowed = false;
	 messages.push(message);
	 setInterval(function () {
		allowed = true;
	  }, 5000); 
	io.emit('chat message', filterMessage(message));
  });
  socket.on('vote', function(vote){
	  console.log(vote);
	 var message = messages[vote.id]
	  if(message){
		 if(message.yesVotes.indexOf(socket.id) === -1 && message.noVotes.indexOf(socket.id) === -1){
			 console.log('voting',socket.id);
			 if(vote.vote === 'no'){
				 message.noVotes.push(socket.id);
			 }else{
				 message.yesVotes.push(socket.id);
			 }
			 io.emit('voteUpdate', filterMessage(message));
		 }else{
			 socket.emit('duplicateVote');
		 }
	 }else{
		 socket.emit('invalidMessage');
	 }
  });
});

http.listen(5555, function(){
  console.log('listening on *:5555');
});