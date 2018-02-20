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
Game.IntroText;
Game.PlayerCount = 0;
Game.PlayerText;
Game.Enemies;
Game.Bullets;
Game.Explosions;

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
    game.load.spritesheet('invader', 'Enemies/invader32x32x4.png', 32, 32);
    game.load.image('enemyBullet', 'Enemies/enemy-bullet.png');
    game.load.spritesheet('kaboom', 'Environment/explode.png', 128, 128);
};

// Create The Game Space and Settings
Game.create = function () {
    //Setup Player Map
    Game.playerMap = {};
    Game.bulletMap = {};

    //  The scrolling starfield background
    Game.BackGround = game.add.tileSprite(0, 0, 1024, 768, 'starfield');

    //Call New Player and New BulletGroup
    GameClient.askNewPlayer(Game.CurrentPlayerName);
    GameClient.getAllPlayers();

    //  Create  An explosion pool
    Game.Explosions = game.add.group();
    Game.Explosions.createMultiple(30, 'kaboom');
    Game.Explosions.forEach(Game.SetupInvader, this);

    //Create Bullet Group
    Game.Bullets = game.add.group();
    Game.Bullets.enableBody = true;
    Game.Bullets.physicsBodyType = Phaser.Physics.ARCADE;
    Game.Bullets.setAll('outOfBoundsKill', true);
    Game.Bullets.setAll('checkWorldBounds', true);

    //Create Invaders Group
    Game.Enemies = game.add.group();
    Game.Enemies.enableBody = true;
    Game.Enemies.physicsBodyType = Phaser.Physics.ARCADE;

    //Setup Input
    Game.cursors = game.input.keyboard.createCursorKeys();
    Game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //Start Game Mech
    Game.PlayerText = game.add.text(10, 10, 'Player Count: 1', { font: "26px Arial", fill: "#ffffff", align: "right" });
    Game.IntroText = game.add.text(game.world.centerX, 400, '- [enter] to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
    Game.IntroText.anchor.setTo(0.5, 0.5);
    Game.IntroText.bringToTop();
    var startKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    startKey.onDown.add(Game.StartGame, this);
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

        //If Items in the Queue
        if (Game.MoveBulletsQueue.length > 0) {
            //Send to Server
            GameClient.saveBulletInformation(Game.MoveBulletsQueue);
        }

        //Loop through Bullets
        for (var c = 0; c < Game.MoveBulletsQueue.length; c++) {
            //Loop through movement updates
            var bullet = Game.MoveBulletsQueue.shift();
            if (bullet) {
                Game.moveOtherBullet(bullet.BulletID, bullet.PlayerID);
            }
        }

        //  Run collision
        game.physics.arcade.overlap(Game.Bullets, Game.Enemies, Game.CollisionHandler, null, this);
    }
};

//// --------- Custom Methods for Multiplayer/etc ----------------------------------------->
//Alien Collision Handler
Game.CollisionHandler = function (bullet, alien) {
    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  Increase the score
    //score += 20;
    //scoreText.text = scoreString + score;
    //This is where taking the Bullet ID would allow us to Tag Score to Players

    //  And create an explosion :)
    var explosion = Game.Explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);

    //if (aliens.countLiving() == 0) {
    //    score += 1000;
    //    scoreText.text = scoreString + score;

    //    enemyBullets.callAll('kill', this);
    //    stateText.text = " You Won, \n Click to restart";
    //    stateText.visible = true;

    //    //the "click to restart" handler
    //    game.input.onTap.addOnce(restart, this);
    //}
};

//Start Game Method
Game.StartGame = function () {
    Game.IntroText.visible = false;
    //Summon NPCs
    Game.CreateInvaders();
};

//Creates and Starts Moving Invaders
Game.CreateInvaders = function () {
    for (var y = 0; y < (3 + Game.PlayerCount); y++) {
        for (var x = 0; x < 16; x++) {
            var alien = Game.Enemies.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [0, 1, 2, 3], 20, true);
            alien.play('fly');
            alien.body.moves = false;
        }
    }

    Game.Enemies.x = 100;
    Game.Enemies.y = 70;

    var speed = 2300 - (Game.PlayerCount * 150);

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    var tween = game.add.tween(Game.Enemies).to({ x: 200 }, speed, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    tween.onRepeat.add(function () { Game.Enemies.y += 10; }, this);
};

// Setup Invader Explosion
Game.SetupInvader = function (invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');
};

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

    //Update Player Count
    Game.PlayerCount++;
    Game.PlayerText.text = 'Player Count: ' + Game.PlayerCount;

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

    //Update Player Count
    Game.PlayerCount--;
    Game.PlayerText.text = 'Player Count: ' + Game.PlayerCount;
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
            Game.Bullets.add(bullet);
        }
    }
}