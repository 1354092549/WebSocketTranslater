#!/usr/bin/env node

function helpAndExit(){
	console.log("Instructions for command line arguments: ");
	console.log("TcpToWebSocket|ToWS <Tcp Server Address> <Tcp Server Port> <WebSocket Listening Port>");
	console.log("WebSocketToTcp|ToTcp <WebSocket Server Address> <WebSocket Server Port> <Tcp Listening Port>");
	console.log("WebSocketToTcp|ToTcp <WebSocketUrl> <Tcp Listening Port>");
	process.exit();
}

function webSocketTranslate(ws,socket){
	ws.on("error",function(error){
		socket.end();
	});
	ws.on("close",function(code,message){
		socket.end();
	});
	socket.on("error",function(error){
		socket.end();
		ws.close();
	});
	socket.on("end",function(had_error){
		ws.close();
	});
	socket.on("data",function(chunk){
		try {
			ws.send(chunk);
		} catch(e) {
			socket.end();
		}
	});
	ws.on("message",function(data){
		socket.write(data);
	});
}

const WebSocket = require("ws");
const net = require("net");
const WebSocketServer = require("ws").Server;
const http = require('http');
var mode = process.argv[2];
if(mode){
	mode=mode.toLowerCase();
}
var server;

switch(mode){
	case "TcpToWebSocket".toLowerCase():
	case "ToWS".toLowerCase():
		if(process.argv.length!=6){
			helpAndExit()
		}
		webServer = http.createServer(function (request, response){
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write("Successful, now you can access the TCP socket through WebSocket.");
			response.end();
		});
		webServer.listen(parseInt(process.argv[5],10), function() {
			server = new WebSocketServer({server: webServer});
			server.on("connection", function(ws, request){
				request.socket.pause()
				var socket = new net.Socket();
				socket.connect({
					"host":process.argv[3],
					"port":process.argv[4]
				},function(){
					request.socket.resume();
				});
				webSocketTranslate(ws,socket);
			});
			console.log("Running...");
		});
		break;
	case "WebSocketToTcp".toLowerCase():
	case "ToTcp".toLowerCase():
		var webSocketUrl;
		var tcpPort;
		if(process.argv.length==6){
			webSocketUrl = "ws://" + process.argv[3] + ":" + process.argv[4] + "/";
			tcpPort = parseInt(process.argv[5],10);
		}else if(process.argv.length==5){
			webSocketUrl = process.argv[3];
			tcpPort = parseInt(process.argv[4],10);
		}else{
			helpAndExit()
		}
		server = net.createServer();
		server.on("connection", function(socket){
			socket.pause();
			var ws = new WebSocket(webSocketUrl);
			ws.on("open",function(){
				socket.resume();
			});
			webSocketTranslate(ws,socket);
		});
		server.listen(tcpPort, function() {
			console.log("Running...");
		});
		break;
	default:
		helpAndExit();
}