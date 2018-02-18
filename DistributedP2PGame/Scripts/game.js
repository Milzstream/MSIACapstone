// Game Container Obj
var Game = {};
Game.cursors = null;
Game.fireButton = null;
Game.CurrentPlayerName = 'Plr1';
Game.CurrentPlayerId = null;
Game.BackGround = null;
Game.AssetsUrl = '';
Game.Active = false;
Game.MoveQueue = [];
Game.MoveBulletsQueue = [];
Game.BulletTime = 0;

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
    Game.bulletMap = {};

    //  The scrolling starfield background
    Game.BackGround = game.add.tileSprite(0, 0, 1024, 768, 'starfield');

    Game.Bullets = game.add.physicsGroup();
    Game.Bullets.createMultiple(32, 'bullet', false);
    Game.Bullets.setAll('checkWorldBounds', true);
    Game.Bullets.setAll('outOfBoundsKill', true);

    //Call New Player and New BulletGroup
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

            //If fire Button Triggered
            if (Game.fireButton.isDown) {
                if (game.time.time > Game.BulletTime) {
                    GameClient.createNewBullet(Game.CurrentPlayerId);
                    Game.BulletTime = game.time.time + 100;
                }
            }

            //Send Movement to Server
            if (!Phaser.Point.equals(player.body.velocity, new Phaser.Point(0, 0))) {
                GameClient.movePlayer(Game.CurrentPlayerId, player.body.x);
            }

            //Set It Back
            Game.playerMap[Game.CurrentPlayerId] = player;
        }

        //If items in the move Queue
        for (var i = 0; i < Game.MoveQueue.length; i++) {
            var item = Game.MoveQueue.shift();
            if (item) {
                Game.moveOtherPlayer(item.ID, item.X);
            }
        }

        //Loop through Bullets
        for (var c = 0; c < Game.MoveBulletsQueue.length; c++) {
            var bullet = Game.MoveBulletsQueue.shift();
            if (bullet) {
                Game.moveOtherBullet(bullet.BulletID, bullet.PlayerID);
            }
        }
    }
};

//// --------- Custom Methods for Multiplayer/etc ----------------------------------------->
//Updates the Player Locations
Game.getAllPlayers = function (playersArr) {
    //Loop through Array
    for (var i = 0; i < playersArr.length; i++) {
        //Pull out Player
        if (playersArr[i] !== null) {
            var player = Game.playerMap[playersArr[i].Id];
            if (!player) {
                Game.addNewPlayer(playersArr[i]);
            } else if (playersArr[i].Id !== Game.CurrentPlayerId) {
                //If Player has Moved
                if (player.body.x !== playersArr[i].X) {
                    //Move Other Player
                    Game.MoveQueue.push({ ID: playersArr[i].Id, X: playersArr[i].X });
                }
            }
            //If Bullets Fired/Moved
            if (playersArr[i].Bullets.length > 0) {
                for (var c = 0; c < playersArr[i].Bullets.length; c++) {
                    Game.MoveBulletsQueue.push({ BulletID: playersArr[i].Bullets[c].Id, PlayerID: playersArr[i].Id });
                }
            }
        }
    }
};

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

//Move Other Player
Game.moveOtherPlayer = function (playerId, xPosition) {
    // Get Player
    var player = Game.playerMap[playerId];

    // If not null
    if (player) {
        player.body.x = xPosition;
        Game.playerMap[playerId] = player;
    }
};

//Remove a Player from the World
Game.removePlayer = function (playerObj) {
    if (Game.playerMap[playerObj.Id] !== null) {
        Game.playerMap[playerObj.Id].destroy();
        delete Game.playerMap[playerObj.Id];
    }
}

//Move Bullet
Game.moveOtherBullet = function (bulletId, playerId) {
    //Get Bullet
    var bullet = Game.bulletMap[bulletId];
    var player = Game.playerMap[playerId]

    //If Exists
    if (player) {
        if (bullet) {
            bullet.body.velocity.y = -600;
            Game.bulletMap[bulletId] = bullet;
        } else {
            bullet = game.add.sprite(player.body.x + 6, player.body.y - 12, 'bullet');
            bullet.z = 2;
            game.physics.arcade.enable(bullet);
            bullet.body.velocity.y = -600;
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
            Game.bulletMap[bulletId] = bullet;
        }
    }
}