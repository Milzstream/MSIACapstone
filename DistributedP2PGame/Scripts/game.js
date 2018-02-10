var InitGame = function (name) {
    var $name = name;
    $("#game").empty();

    $(document).ready(function () {
        var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

        function preload() {

            game.load.baseURL = 'http://localhost:50137/Assets/';
            game.load.crossOrigin = 'anonymous';

            game.load.image('ship', 'Ship/thrust_ship2.png');
            game.load.image('bullet', 'Ship/bullet0.png');
            game.load.image('starfield', 'Platform/starfield.png');
        }

        var player;
        var bullets;

        var cursors;
        var fireButton;

        var bulletTime = 0;
        var bullet;

        function create() {

            //  The scrolling starfield background
            starfield = game.add.tileSprite(0, 0, 1024, 768, 'starfield');

            bullets = game.add.physicsGroup();
            bullets.createMultiple(32, 'bullet', false);
            bullets.setAll('checkWorldBounds', true);
            bullets.setAll('outOfBoundsKill', true);

            var name = game.add.text(14, 40, $name, { font: '16px Arial', fill: '#74a6f7', align: 'center' });
            name.anchor.set(0.5);
            player = game.add.sprite(512, 718, 'ship');
            game.physics.arcade.enable(player);
            player.body.collideWorldBounds = true;
            player.addChild(name);


            cursors = game.input.keyboard.createCursorKeys();
            fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        }

        function update() {
            //  Scroll the background
            starfield.tilePosition.y += 2;

            player.body.velocity.x = 0;

            if (cursors.left.isDown) {
                player.body.velocity.x = -600;
            }
            else if (cursors.right.isDown) {
                player.body.velocity.x = 600;
            }

            if (fireButton.isDown) {
                fireBullet();
            }

        }

        function fireBullet() {

            if (game.time.time > bulletTime) {
                bullet = bullets.getFirstExists(false);

                if (bullet) {
                    bullet.reset(player.x + 6, player.y - 12);
                    bullet.body.velocity.y = -600;
                    bulletTime = game.time.time + 100;
                }
            }

        }

        function render() {

        }

    });
};