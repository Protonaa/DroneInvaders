// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Images
const background = new Image();
background.src = 'background.jpg';
const playerImg = new Image();
playerImg.src = 'spaceship.png';

// Load alien images
const alienImages = [];
for (let i = 1; i <= 6; i++) {
    const img = new Image();
    img.src = `alien${i}.png`; // Assuming filenames are alien1.png, alien2.png, etc.
    alienImages.push(img);
}

// Bullet images
const playerBulletImg = new Image();
playerBulletImg.src = 'bullet2.png'; // Path to player bullet image

const alienBulletImg = new Image();
alienBulletImg.src = 'bullet.png'; // Path to alien bullet image


// Player variables
const player = {
    width: 90,
    height: 90,
    x: canvas.width / 2 - 45,
    y: canvas.height - 150,
    speed: 7,
    dx: 0,
    bullets: [],
    hitboxWidth: 70,  // Reduced hitbox width
    hitboxHeight: 70, // Reduced hitbox height
    lives: 3,         // Player starts with 3 lives
    invincible: false, // Flag for invincibility
    invincibleTimer: 0, // Timer for invincibility
    respawnX: canvas.width / 2 - 45, // Last position before death
    respawnY: canvas.height - 150   // Last position before death
};

// Alien variables
const alienSize = { width: 75, height: 75 };
let aliens = [];
let alienRows = 3;
let alienCols = 8;
const alienSpacing = 20;
let alienSpeed = 1;
let alienDirection = 1;
const alienBullets = [];
let alienShootInterval = 800; // Aliens shoot every 0.8 seconds
let lastAlienShootTime = 0;

// Score and level
let score = 0;
let level = 1;

// Menu and game state
let isGameOver = false;
let gameRunning = true;
let isMenuOpen = false;

function initializeAliens() {
    aliens = [];
    const startX = alienSpacing;  // Position aliens starting from the left
    const startY = alienSpacing;  // Position aliens starting from the top

    for (let row = 0; row < alienRows; row++) {
        for (let col = 0; col < alienCols; col++) {
            aliens.push({
                x: startX + col * (alienSize.width + alienSpacing),  // Adjusted x position
                y: startY + row * (alienSize.height + alienSpacing), // Adjusted y position
                width: alienSize.width,
                height: alienSize.height,
                img: alienImages[Math.floor(Math.random() * alienImages.length)] // Random image
            });
        }
    }
}


// Draw background
function drawBackground() {
    const pattern = ctx.createPattern(background, 'repeat');
    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Draw player
function drawPlayer() {
    if (player.invincible) {
        // Flashing effect when invincible
        ctx.globalAlpha = Math.random() > 0.5 ? 0.5 : 1; 
    }
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1; // Reset alpha after drawing player
}


function drawAliens() {
    aliens.forEach(alien => {
        ctx.drawImage(alien.img, alien.x, alien.y, alien.width, alien.height);
    });
}


// Draw bullets
function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.drawImage(playerBulletImg, bullet.x, bullet.y, 35, 35); // Adjust size as needed
    });

    alienBullets.forEach(bullet => {
        ctx.drawImage(alienBulletImg, bullet.x, bullet.y, 35, 35); // Adjust size as needed
    });
}



// Move player
function movePlayer() {
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Handle keyboard input
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    } else if (e.key === ' ' && player.bullets.length < 5) {
        player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, speed: 5 });
    } else if (e.key === 'Escape') {
        toggleMenu();
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'a') {
        player.dx = 0;
    }
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Update game frame
function update() {
    if (!gameRunning) return;

    clearCanvas();
    drawBackground();
    drawPlayer();
    drawAliens();
    drawBullets();
    movePlayer();
    moveBullets();
    moveAliens();
    alienShootLogic();
    checkCollisions();
    drawScoreLevel();

    if (aliens.length === 0) {
        nextLevel();
    }

    // Handle invincibility
    if (player.invincible) {
        const now = Date.now();
        if (now - player.invincibleTimer > 2000) { // 2 seconds invincibility
            player.invincible = false;
        }
    }

    requestAnimationFrame(update);
}

// Player bullet movement
function moveBullets() {
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) player.bullets.splice(index, 1);
    });

    alienBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) alienBullets.splice(index, 1);
    });
}

function moveAliens() {
    let switchDirection = false;

    aliens.forEach(alien => {
        alien.x += alienSpeed * alienDirection;
        if (alien.x <= 0 || alien.x + alienSize.width >= canvas.width) {
            switchDirection = true;
        }

        // Check if any alien has reached the player's y position
        if (alien.y + alienSize.height >= player.y) {
            gameOver();  // End the game if an alien reaches the player
        }
    });

    if (switchDirection) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.y += alienSize.height;
        });
    }
}

// Alien shooting logic
function alienShootLogic() {
    const now = Date.now();
    if (now - lastAlienShootTime > alienShootInterval) {
        lastAlienShootTime = now;

        if (aliens.length > 0) {
            const randomAlien = aliens[Math.floor(Math.random() * aliens.length)];
            alienBullets.push({
                x: randomAlien.x + randomAlien.width / 2 - 2,
                y: randomAlien.y + randomAlien.height,
                speed: 3
            });
        }
    }
}

// Check collisions
function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        aliens.forEach((alien, alienIndex) => {
            if (
                bullet.x < alien.x + alien.width &&
                bullet.x + 5 > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + 10 > alien.y
            ) {
                aliens.splice(alienIndex, 1);
                player.bullets.splice(bulletIndex, 1);
                score += 10;
            }
        });
    });

    alienBullets.forEach((bullet, index) => {
        if (
            bullet.x < player.x + player.hitboxWidth &&  // Use the reduced hitbox width
            bullet.x + 5 > player.x &&
            bullet.y < player.y + player.hitboxHeight &&  // Use the reduced hitbox height
            bullet.y + 10 > player.y
        ) {
            if (!player.invincible) {
                gameOver();
            }
        }
    });
}

// Draw score and level
function drawScoreLevel() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Level: ${level}`, canvas.width - 120, 30);
    ctx.fillText(`Score: ${score}`, canvas.width - 120, 60);
    ctx.fillText(`Lives: ${player.lives}`, canvas.width - 120, 90); // Add lives counter
}

// Next level
function nextLevel() {
    level++;
    alienRows++;
    alienCols++;
    alienSpeed += 0.25;
    initializeAliens();
}

// Restart game
function restartGame() {
    score = 0;
    level = 1;
    player.lives = 3;
    player.bullets = [];
    alienBullets.length = 0;
    gameRunning = true;
    isGameOver = false;
    initializeAliens();
    document.getElementById('endScreen').classList.add('hidden');
    document.getElementById('menu').classList.add('hidden');
    update();
}

// Share on Twitter
function shareOnTwitter() {
    const tweet = `I scored ${score} in Space Invaders! Can you beat my score? #SpaceInvaders`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
}

// Toggle menu
function toggleMenu() {
    const menu = document.getElementById('menu');
    isMenuOpen = !isMenuOpen;
    menu.classList.toggle('hidden', !isMenuOpen);
    gameRunning = !isMenuOpen;
    if (!isMenuOpen) update();
}

// Game Over
function gameOver() {
    if (player.lives > 0) {
        player.lives--; // Decrease lives
        player.invincible = true; // Start invincibility
        player.invincibleTimer = Date.now(); // Start invincibility timer
        player.x = player.respawnX; // Set respawn position
        player.y = player.respawnY;
        setTimeout(() => {
            player.invincible = false; // End invincibility after 2 seconds
        }, 2000);
    } else {
        gameRunning = false;
        isGameOver = true;
        const endScreen = document.getElementById('endScreen');
        endScreen.classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalLevel').textContent = level;
    }
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('twitterBtn').addEventListener('click', shareOnTwitter);
document.getElementById('restartBtn1').addEventListener('click', restartGame);
document.getElementById('twitterBtn1').addEventListener('click', shareOnTwitter);
document.getElementById('menuBtn').addEventListener('click', toggleMenu);

// Initialize game
initializeAliens();
update();
