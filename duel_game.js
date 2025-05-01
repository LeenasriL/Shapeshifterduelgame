class Shape {
    constructor(x, y, color, shapeType) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.color = color;
        this.shapeType = shapeType;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.shapeType === 'Circle') {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shapeType === 'Square') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.shapeType === 'Triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Player extends Shape {
    constructor(x, y) {
        super(x, y, 'blue', 'Circle');
        this.health = 100;
        this.lives = 3;
        this.score = 0;
        this.level = 1;
        this.speed = 5;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.lives--;
            this.health = 100;
            if (this.lives <= 0) {
                alert('Game Over! Final Score: ' + this.score);
                document.location.reload();
            }
        }
    }

    levelUp() {
        this.level++;
        this.health = Math.max(40, this.health - 10); // Decrease health but not below 40
        this.speed += 1; // Increase speed
    }
}

class Projectile {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = 5;
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(other) {
        const dist = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
        return dist < this.radius + other.width / 2; // Assuming other is a circle
    }
}

class Enemy extends Shape {
    constructor(x, y, shapeType) {
        super(x, y, 'orange', shapeType);
        this.health = 30;
        this.speed = 2;
    }

    move() {
        this.y += this.speed;
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(200, 500);
        this.projectiles = [];
        this.enemies = [];
        this.isGameOver = false;
        this.spawnEnemyInterval = setInterval(() => this.spawnEnemy(), 1500);
        this.lastShotTime = 0;
        this.SHOT_DELAY = 200;
        this.isPaused = false;

        this.setupControls();
        this.gameLoop();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;

            if (e.key === 'p') {
                this.isPaused = !this.isPaused; // Toggle pause
                return;
            }

            if (this.isPaused) return; // Ignore controls if paused

            if (e.key === 'ArrowLeft' && this.player.x > 0) this.player.x -= this.player.speed;
            if (e.key === 'ArrowRight' && this.player.x < this.canvas.width - this.player.width) this.player.x += this.player.speed;
            if (e.key === 'ArrowUp' && this.player.y > 0) this.player.y -= this.player.speed;
            if (e.key === 'ArrowDown' && this.player.y < this.canvas.height - this.player.height) this.player.y += this.player.speed;

            if (e.key === ' ') {
                const currentTime = Date.now();
                if (currentTime - this.lastShotTime > this.SHOT_DELAY) {
                    this.projectiles.push(new Projectile(this.player.x + this.player.width / 2, this.player.y, 0, -5));
                    this.lastShotTime = currentTime;
                }
            }

            if (e.key === '2') {
                this.player.shapeType = 'Square';
                this.player.color = 'green'; // Change color for square
            } else if (e.key === '3') {
                this.player.shapeType = 'Triangle';
                this.player.color = 'purple'; // Change color for triangle
            }
        });
    }

    spawnEnemy() {
        const shapeType = Math.random() < 0.5 ? 'Circle' : 'Square';
        const xPos = Math.random() * (this.canvas.width - 30);
        this.enemies.push(new Enemy(xPos, 0, shapeType));
    }

    checkCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(i, 1);
                continue;
            }

            if (this.player.collidesWith(enemy)) {
                this.player.takeDamage(10);
                this.enemies.splice(i, 1);
            }

            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const projectile = this.projectiles[j];
                if (projectile.collidesWith(enemy)) {
                    enemy.health -= 10;
                    this.projectiles.splice(j, 1);
                    if (enemy.health <= 0) {
                        this.enemies.splice(i, 1);
                        this.player.score += 10;
                        if (this.player.score % 50 === 0) {
                            this.player.levelUp();
                        }
                    }
                    break;
                }
            }
        }
    }

    update() {
        if (this.isPaused) return; // Skip update if paused
        for (const enemy of this.enemies) {
            enemy.move();
        }
        for (const projectile of this.projectiles) {
            projectile.move();
        }
        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.ctx);
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }

        // Draw health, lives, score, and level
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`Health: ${this.player.health}`, 10, 20);
        this.ctx.fillText(`Lives: ${this.player.lives}`, 10, 40);
        this.ctx.fillText(`Score: ${this.player.score}`, 10, 60);
        this.ctx.fillText(`Level: ${this.player.level}`, 10, 80);
        if (this.isPaused) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '30px Arial';
            this.ctx.fillText('PAUSED', this.canvas.width / 2 - 50, this.canvas.height / 2);
        }
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Predefined game logic
class PredefinedGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.enemies = [];
        this.score = 0;
        this.score = 0;
        this.level = 1;
        this.speed = 5;
        this.spawnEnemyInterval = setInterval(() => this.spawnEnemy(), 1500);
        this.gameLoop();
    }

    spawnEnemy() {
        const shapeType = Math.random() < 0.5 ? 'Circle' : 'Square';
        const xPos = Math.random() * (this.canvas.width - 30);
        this.enemies.push(new Enemy(xPos, 0, shapeType));
    }

    update() {
        for (const enemy of this.enemies) {
            enemy.move();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize games
window.onload = () => {
    new PredefinedGame('predefinedCanvas');
    new Game('userCanvas');
};