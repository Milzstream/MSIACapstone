var GameClient = {};

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

//Creates a player Bullet
GameClient.createNewBullet = function (playerId) {
    GameClient.playerHub.server.addNewBullet(playerId);
};

//Get All Players
GameClient.getAllPlayers = function () {
    GameClient.playerHub.server.getAllPlayers();
};

//Save Bullet Information
GameClient.saveBullet = function (playerObj) {
    GameClient.playerHub.server.saveBulletInformation(playerObj);
};

//Move Player
GameClient.movePlayer = function (playerId, xPosition) {
    //console.log("Player: " + playerId + " | X Position: " + xPosition);
    GameClient.playerHub.server.movePlayer(playerId, xPosition);
};

//Send Bullet Info to Server
GameClient.saveBulletInformation = function (bulletArr) {
    GameClient.playerHub.server.saveBulletInformation(bulletArr);
};

//Send Game Start Request
GameClient.requestGameStart = function () {
    GameClient.playerHub.server.requestGameStart();
};

//Send and Track Scores
GameClient.updateScores = function (playerId) {
    GameClient.playerHub.server.updateScores(playerId);
};

// ------------ > Calls From the Server Below (Calls to the Server Above) ---------->

//UpdateScores
GameClient.playerHub.client.updateScores = function (playersArr) {
    //Execute Updates
    $("#scores-container").empty();
    for (var i = 0; i < playersArr.length; i++) {
        $("#scores-container").append("<li>" + playersArr[i].Name + " : " + playersArr[i].Score + "</li>");
    }
};

//Recieved Start Request
GameClient.playerHub.client.requestGameStart = function () {
    Game.PlayerReadyCount++;
};

//Setup Hub New Player Call
GameClient.playerHub.client.newPlayer = function (playerObj) {
    if (Game.Active) {
        Game.addNewPlayer(playerObj);
    }
};

// Calls the Remove Player Function
GameClient.playerHub.client.removePlayer = function (playerObj) {
    if (Game.Active) {
        Game.removePlayer(playerObj);
    }
};

//Recieves all the Players
GameClient.playerHub.client.getAllPlayers = function (playersArr) {
    if (Game.Active) {
        Game.getAllPlayers(playersArr);
    }
};