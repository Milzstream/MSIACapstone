﻿var GameClient = {};

//Setup SignalR Hub
GameClient.playerHub = $.connection.playerHub;
$.connection.hub.start();

GameClient.getHubID = function () {
    return GameClient.playerHub.connection.id;
};

// Calls the New Player Function
GameClient.askNewPlayer = function (playerName) {
    //Send Request for New Player to Server
    GameClient.playerHub.server.newPlayer(playerName);
};

//Get All Players
GameClient.getAllPlayers = function () {
    GameClient.playerHub.server.getAllPlayers();
};

//Move Player
GameClient.movePlayer = function () {

};

// ------------ > Calls From the Server Below (Calls to the Server Above) ---------->

//Setup Hub New Player Call
GameClient.playerHub.client.newPlayer = function (playerObj) {
    Game.addNewPlayer(playerObj);
};

// Calls the Remove Player Function
GameClient.playerHub.client.removePlayer = function (playerObj) {
    Game.removePlayer(playerObj);
};

//Recieves all the Players
GameClient.playerHub.client.getAllPlayers = function (playersArr) {
    Game.getAllPlayers(playersArr);
};