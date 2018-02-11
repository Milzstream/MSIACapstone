// Game Container Obj
var Game = {};
Game.bullets = null;
Game.cursors = null;
Game.fireButton = null;
Game.bulletTime = 0;
Game.bullet = null;
Game.CurrentPlayerName = 'Plr1';
Game.CurrentPlayerId = null;
Game.BackGround = null;
Game.AssetsUrl = '';
Game.Active = false;
Game.MoveQueue = [];

// Over arching Game Object
$('#game').empty();
var game = new Phaser.Game(1024, 768, Phaser.AUTO, document.getElementById('game'));
game.state.add('Game', Game);

// Set PlayerName (and Start Game)
Game.SetPlayerName = function (currentPlayerName) {
    Game.CurrentPlayerName = currentPlayerName;
    game.state.start('Game');
    Game.Active = true;
};

// Init the Game
Game.init = function () {
    game.stage.disableVisibilityChange = true;
};

// Preload the Assets
Game.preload = function () {
    game.load.baseURL = Game.AssetsUrl;
    game.load.image('ship', 'Ship/thrust_ship2.png');
    game.load.image('bullet', 'Ship/bullet0.png');
    game.load.image('starfield', 'Platform/starfield.png');
};

// Create The Game Space and Settings
Game.create = function () {
    //Setup Player Map
    Game.playerMap = {};

    //  The scrolling starfield background
    Game.BackGround = game.add.tileSprite(0, 0, 1024, 768, 'starfield');

    Game.bullets = game.add.physicsGroup();
    Game.bullets.createMultiple(32, 'bullet', false);
    Game.bullets.setAll('checkWorldBounds', true);
    Game.bullets.setAll('outOfBoundsKill', true);

    //Call New Player
    GameClient.askNewPlayer(Game.CurrentPlayerName);
    GameClient.getAllPlayers();

    //Setup Input
    Game.cursors = game.input.keyboard.createCursorKeys();
    Game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
};

// The Game Update Method (Movement/Background/Etc)
Game.update = function () {
    // Scroll the Background
    Game.BackGround.tilePosition.y += 2;

    //Check Player ID
    if (Game.CurrentPlayerId !== null) {

        //Get Player
        var player = Game.playerMap[Game.CurrentPlayerId];

        //Player Movements to/from/client
        if (player !== null) {
            //Not Moving
            player.body.velocity.x = 0;

            //Input Watch
            if (Game.cursors.left.isDown) {
                player.body.velocity.x = -600;
            }
            else if (Game.cursors.right.isDown) {
                player.body.velocity.x = 600;
            }

            //Send Movement to Server
            if (!Phaser.Point.equals(player.body.velocity, new Phaser.Point(0, 0)) ) {
                GameClient.movePlayer(Game.CurrentPlayerId, player.body.x);
            }

            //Set It Back
            Game.playerMap[Game.CurrentPlayerId] = player;
        }

        //If items in the move Queue
        if (Game.MoveQueue.length > 0) {
            var item = Game.MoveQueue.shift();
            Game.moveOtherPlayer(item.ID, item.X);
        }
    }
};

//// --------- Custom Methods for Multiplayer/etc ----------------------------------------->

//Add player to World
Game.addNewPlayer = function (playerObj) {
    //Setup Player and Player Name
    var name = game.add.text(14, 40, playerObj.Name, { font: '16px Arial', fill: '#74a6f7', align: 'center' });
    name.anchor.set(0.5);

    //Create Player
    var player = game.add.sprite(playerObj.X, 718, 'ship');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    player.addChild(name);

    //Add Player to Map
    Game.playerMap[playerObj.Id] = player;

    //If client ID Null Set it
    if (Game.CurrentPlayerId === null) {
        Game.CurrentPlayerId = GameClient.getHubID();
    }
};

//Updates the Player Locations
Game.getAllPlayers = function(playersArr) {
    //Loop through Array
    for (var i = 0; i < playersArr.length; i++) {
        //Pull out Player
        if (playersArr[i] !== null) {1
            var player = Game.playerMap[playersArr[i].Id];
            if (!player) {
                Game.addNewPlayer(playersArr[i]);
            } else if (playersArr[i].Id !== Game.CurrentPlayerId) {
                //If It has Moved
                if (player.body.x !== playersArr[i].X) {
                    //Move Other Player
                    Game.MoveQueue.push({ ID: playersArr[i].Id, X: playersArr[i].X });
                }
            }
        }
    }
};

//Move Other Player
Game.moveOtherPlayer = function (playerId, xPosition) {
    // Get Player
    var player = Game.playerMap[playerId];

    // If not null
    if (player !== null) {
        player.body.x = xPosition;
        Game.playerMap[playerId] = player;
    }
};

//Handles Movment of a player
Game.movePlayer = function (playerObj) {
    var player = Game.playerMap[playerObj.Id];

    //Level Set Player Movement
    player.body.velocity.x = 0;

    //Input Watch
    if (Game.cursors.left.isDown) {
        player.body.velocity.x = -600;
    }
    else if (Game.cursors.right.isDown) {
        player.body.velocity.x = 600;
    }

    //if (Game.fireButton.isDown) {
    //    Game.fireBullet();
    //}

}

//Remove a Player from the World
Game.removePlayer = function (playerObj) {
    if (Game.playerMap[playerObj.Id] !== null) {
        Game.playerMap[playerObj.Id].destroy();
        delete Game.playerMap[playerObj.Id];
    }
}

// Fire Bullet Method
Game.fireBullet = function () {
    if (game.time.time > Game.bulletTime) {
        Game.bullet = Game.bullets.getFirstExists(false);

        if (Game.bullet) {
            Game.bullet.reset(Game.player.x + 6, Game.player.y - 12);
            Game.bullet.body.velocity.y = -600;
            Game.bulletTime = game.time.time + 100;
        }
    }
};





























//var InitGame = function (name) {
//    var $name = name;
//    $("#game").empty();

//    $(document).ready(function () {
//        var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

//        function preload() {

//            game.load.baseURL = 'http://localhost:50137/Assets/';
//            game.load.crossOrigin = 'anonymous';

//            game.load.image('ship', 'Ship/thrust_ship2.png');
//            game.load.image('bullet', 'Ship/bullet0.png');
//            game.load.image('starfield', 'Platform/starfield.png');
//        }

//        var player;
//        var bullets;

//        var cursors;
//        var fireButton;

//        var bulletTime = 0;
//        var bullet;

//        function create() {

//            //  The scrolling starfield background
//            starfield = game.add.tileSprite(0, 0, 1024, 768, 'starfield');

//            bullets = game.add.physicsGroup();
//            bullets.createMultiple(32, 'bullet', false);
//            bullets.setAll('checkWorldBounds', true);
//            bullets.setAll('outOfBoundsKill', true);

//            var name = game.add.text(14, 40, $name, { font: '16px Arial', fill: '#74a6f7', align: 'center' });
//            name.anchor.set(0.5);
//            player = game.add.sprite(512, 718, 'ship');
//            game.physics.arcade.enable(player);
//            player.body.collideWorldBounds = true;
//            player.addChild(name);


//            cursors = game.input.keyboard.createCursorKeys();
//            fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

//        }

//        function update() {
//            //  Scroll the background
//            starfield.tilePosition.y += 2;

//            player.body.velocity.x = 0;

//            if (cursors.left.isDown) {
//                player.body.velocity.x = -600;
//            }
//            else if (cursors.right.isDown) {
//                player.body.velocity.x = 600;
//            }

//            if (fireButton.isDown) {
//                fireBullet();
//            }

//        }

//        function fireBullet() {

//            if (game.time.time > bulletTime) {
//                bullet = bullets.getFirstExists(false);

//                if (bullet) {
//                    bullet.reset(player.x + 6, player.y - 12);
//                    bullet.body.velocity.y = -600;
//                    bulletTime = game.time.time + 100;
//                }
//            }

//        }

//        function render() {

//        }

//    });
//};