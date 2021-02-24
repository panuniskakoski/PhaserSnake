// --------Pelin alustus-----------------------
// Luodaan uusi scene
let gameScene = new Phaser.Scene('Game');

// Asetetaan pelin konfiguraatiot
let config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// --------Muuttujat---------------------------

// Luodaan muuttujat
var snake;
var cursors;
var food;

// Suuntamuuttujat
var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

// --------Pelin luominen ja konfiguraatioiden asettaminen------------

// Luodaan peli ja passataan konfiguraatiot
let game = new Phaser.Game(config);


// --------Funktiot----------------------------
// Ladattaan kaikki tarvittavat assetit valmiiksi muistiin
function preload ()
{
    this.load.image('food', 'assets/apple.png');
    this.load.image('head', 'assets/head.png');
    this.load.image('body', 'assets/body.png');
    this.load.image('skull', 'assets/skull.png');
}

// Erilaisten pelioliluokkien luominen
// Suoritetaan vain kerran
function create ()
{
    // Luodaan syötäville luokka
    var Food = new Phaser.Class({
        
        Extends: Phaser.GameObjects.Image,
        
        initialize:
        
        // Alustetaan kaikki ruokaobjektin attribuutit
        function Food (scene, x, y) 
        {
            Phaser.GameObjects.Image.call(this, scene)

            this.setTexture('food');
            // this.setScale(.5);
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);

            // Monta syöty
            this.total = 0;

            scene.children.add(this);
        },
        
        eat: function ()
        {
            this.total++;
            
            // Toistetaan syömisääni
            // TODO
            
            // Arvotaan uusi sijainti ruualle sen jälkeen kun edellinen on syöty
            var x = Phaser.Math.Between(0, 39);
            var y = Phaser.Math.Between(0, 29);

            this.setPosition(x * 16, y * 16);
        }
    });
    
    
    // Luodaan käärmeen luokka
    var Snake = new Phaser.Class({
        initialize:
        
        // Alustetaan kaikki käärmeobjektin attribuutit
        function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            
            this.body = scene.add.group();
            
            this.head = this.body.create(x * 16, y * 16, 'head');
            this.head.setOrigin(0);
            
            this.alive = true;
            
            this.speed = 100;
            
            this.moveTime = 0;
            
            // Käärmeen häntä. Seurataan hännän päätä, jotta tiedetään mistä kohtaa käärmettä jatketaan tarpeen tullen
            this.tail = new Phaser.Geom.Point(x, y);
            
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        
        // Päivitetään käärmettä pelialueella
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        
        // Käärmeen kääntymislogiikka.
        // Riippumattomia käärmeen nykyisestä suunnasta
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },

        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },

        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },

        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        
        // Käärmeen liikkumislogiikka alueella ja kropan kääntäminen käännekohdassa
        // Jätän alkuperäisen kirjoittajan kommentit paikalleen, jotta voin
        // palata niihin tarpeen tullen.
        move: function (time)
        {
            /** @OriginalAuthor
            * Based on the heading property (which is the direction the pgroup pressed)
            * we update the headPosition value accordingly.
            * 
            * The Math.wrap call allow the snake to wrap around the screen, so when
            * it goes off any of the sides it re-appears on the other.
            */
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;

                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;

                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;

                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }

            this.direction = this.heading;

            //  @OriginalAuthor / Update the body segments and place the last coordinate into this.tail
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);

            // Käydään läpi kaikki käärmetaulukon osat ja verrataan niiden koordinaatteja pään 
            // kanssa. Mikäli koordinaatiot ovat samat, käärme törmää itseensä ja peli loppuu.
            var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);

            // Tarkastus enne jatkamista
            // Jos törmäys tapahtuu. Peli loppuu
            if (hitBody)
            {
                console.log('Snake dead. Game over!');
                this.head.setTexture('skull');
                this.alive = false;

            }
            else{
                //  @OriginalAuthor / Update the timer ready for the next movement
                this.moveTime = time + this.speed;
                return true;
            }
        },
        
        // Funktio käärmeen kasvamiselle
        grow: function ()
        {
            // Määritetään nykyisen hännän pään perusteella
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');

            newPart.setOrigin(0);
        },
        
        // Mitä käy kun törmätään ruokaobjektin kanssa
        collideWithFood: function (food)
        {
            // Törmäys täytyy tapahtua nimenomaan käärmeen pään kanssa
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();

                food.eat();

                //  Jos syötyjen omenoiden totaali on viidellä jaollinen, käärmeen nopeus kasvaa
                if (this.speed > 20 && food.total % 5 === 0)
                {
                    this.speed -= 5;
                }

                
                return true;
            }
            else
            {
                return false;
            }
        },
        
        // Apugridin päivitys
        updateGrid: function (grid)
        {
            // Valitoidaan käytettävissä olevat gridin ruudut ts. uncheckataan kaikki mihin 
            // ruoka ei saa ilmestyä.
            this.body.children.each(function (segment) {

                var bx = segment.x / 16;
                var by = segment.y / 16;

                grid[by][bx] = false;

            });

            // Palautetaan tarkastettu grid
            return grid;
        }
        
    });
    
    // Luodaan käärme ja asetetaan se pelialueelle
    snake = new Snake(this, 8, 8);
    
    // Luodaan ruokaobjekti
    food = new Food(this, 3, 4);
    
    
    
    // Luodaan näppäimistökontrollit
    cursors = this.input.keyboard.createCursorKeys();
}

// Kaikki mitä päivitetään ajon aikana joka framella
function update(time, delta)
{
    // Kuollut mato ei lue näppäimiä
    if (!snake.alive)
    {
        return;
    }

    /** @OriginalAuthor
    * Check which key is pressed, and then change the direction the snake
    * is heading based on that. The checks ensure you don't double-back
    * on yourself, for example if you're moving to the right and you press
    * the LEFT cursor, it ignores it, because the only valid directions you
    * can move in at that time is up and down.
    */
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }

    if (snake.update(time))
    {
        // Mikäli käärmettä liikutettiin, on tarkistettava törmäykset ruuan kanssa
        if (snake.collideWithFood(food))
        {
            // Tällöin on myös tarkistettava vapaana olevat ruudut
            repositionFood();        
        }
    }
}

/** @OriginalAuthor
* We can place the food anywhere in our 40x30 grid
* *except* on-top of the snake, so we need
* to filter those out of the possible food locations.
* If there aren't any locations left, they've won!
*
* @method repositionFood
* @return {boolean} true if the food was placed, otherwise false
*/
function repositionFood ()
{
    //  Aluksi luodaan tyhjä grid mikä olettaa kaikkien ruutujen olevan valideja

    //  Tämä kyseinen grid alustetaan aina, kun omena syödään
    var testGrid = [];

    // Alustetaan ruudut sopiviksi
    for (var y = 0; y < 30; y++)
    {
        testGrid[y] = [];

        for (var x = 0; x < 40; x++)
        {
            testGrid[y][x] = true;
        }
    }

    // Kutsutaan käärmeen updateGrid metodia juuri alustettu grid parametrina
    // Kyseinen metodi merkkaa gridiin jokaisen ruudun johon omena ei voi spawnata
    snake.updateGrid(testGrid);

    //  Erotellaan validit ruudut
    var validLocations = [];

    for (var y = 0; y < 30; y++)
    {
        for (var x = 0; x < 40; x++)
        {
            if (testGrid[y][x] === true)
            {
                //  Is this position valid for food? If so, add it here ...
                validLocations.push({ x: x, y: y });
            }
        }
    }

    // Tarkastetaan onko sopivia ruutuja jäljellä
    // Jos ei, pelaaja voitti pelin.
    if (validLocations.length > 0)
    {
        //  RNG:llä valitaan sopivista ruuduista
        var pos = Phaser.Math.RND.pick(validLocations);

        //  Ja asetetaan ruoka ruutuun
        food.setPosition(pos.x * 16, pos.y * 16);

        return true;
    }
    else
    {
        return false;
    }
}
