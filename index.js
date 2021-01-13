var express = require('express'); 
var app = express();
var http = require('http').createServer(app);
var fs = require('fs');
//挂载至https服务
let sslOptions = {
        key: fs.readFileSync('C:/privkey.key'),//私钥
        cert: fs.readFileSync('C:/cacert.pem')//证书
    };
    
const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

https.listen(443, () => {
    console.log('https listen on');
});

app.get('/',(req,res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/camera', (req, res) => {
    res.sendFile(__dirname + '/camera.html');
});

io.on("connection",(socket) => {
    socket.join(socket.id);
    console.log("a user connected" + socket.id);

    socket.on("disconnect",() => {
        console.log("user disconnected:" + socket.id);
        socket.broadcast.emit('user disconnected',socket.id);
    });

    //实现多用户聊天室用 视频通话中不调用这个事件 可删除
    socket.on("chat message", (msg) => {
        console.log(socket.io + "say:" + msg);
        //io.emit("chat message", msg);//发送的包括自己
        socket.broadcast.emit("chat message", msg);//发送的不包括自己
    });

    socket.on("new user greet", (data) => {
        console.log(data);
        console.log(socket.id + 'greet' + data.msg);
        socket.broadcast.emit('need connect',{sender:socket.id, msg : data.msg})
    });


    socket.on("ok we connect", (data) => {
        io.to(data.receiver).emit('ok we connect', {sender: data.sender})
    });

    socket.on('sdp', (data) => {
        console.log('sdp');
        console.log(data.description);
        socket.to(data.to).emit('sdp',{description: data.description, sender: data.sender})
    });
    socket.on('ice candidates', (data) => {
        console.log('ice candidates: ');
        console.log(data);
        socket.to(data.to).emit('ice candidates',{candidate: data.candidate, sender: data.sender})
    });

})

http.listen(3000,() => {
    console.log('listening on *:3000');
});