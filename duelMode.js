/**
 * Duel Mode for ShapeShifterDuel
 * 
 * This mode allows two players to compete against each other locally.
 */
class DuelMode {
    constructor(canvas, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.gameUI = new GameUI();
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameOverState = false;
        this.level = 1;
        this.levelObj = null;
        
        // Players
        this.player1 = null;
        this.player2 = null;
        
        // Game objects
        this.projectiles = [];
        this.enemies = [];
        this.powerUps = [];
        
        // Timing
        this.lastFrameTime = 0;
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.animationFrameId = null;
        
        // Game settings
        this.enemySpawnRate = 3000; // ms
        this.powerUpSpawnRate = 10000; // ms
        this.maxEnemies = 5;
        
        // Input state
        this.keys = {
            // Player 1 controls (arrow keys + space + num keys)
            p1Left: false,
            p1Right: false,
            p1Up: false,
            p1Down: false,
            p1Fire: false,
            p1Circle: false,
            p1Triangle: false,
            p1Cube: false,
            
            // Player 2 controls (WASD + F + Z/X/C)
            p2Left: false,
            p2Right: false,
            p2Up: false,
            p2Down: false,
            p2Fire: false,
            p2Circle: false,
            p2Triangle: false,
            p2Cube: false,
            
            // Game controls
            pause: false,
            escape: false
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }
    
    /**
     * Start duel mode at a specific level
     */
    start(level = 1) {
        this.level = level;
        this.levelObj = new Level(level);
        this.resetGameState();
        this.setupKeyboardInput();
        this.isRunning = true;
        this.startGameLoop();
    }
    
    /**
     * Reset all game state for a new duel session
     */
    resetGameState() {
        // Create players
        const centerX = this.canvas.width / 2;
        const player1Y = this.canvas.height - 100;
        const player2Y = 100;
        
        this.player1 = new Circle(centerX, player1Y);
        this.player1.color = COLORS.PLAYER_BLUE;
        this.player1.isPlayer = true;
        this.player1.playerId = 1;
        this.player1.health = 100;
        this.player1.maxHealth = 100;
        
        this.player2 = new Circle(centerX, player2Y);
        this.player2.color = COLORS.PLAYER_RED;
        this.player2.isPlayer = true;
        this.player2.playerId = 2;
        this.player2.health = 100;
        this.player2.maxHealth = 100;
        
        // Reset game objects
        this.projectiles = [];
        this.enemies = [];
        this.powerUps = [];
        
        // Reset timers
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // Reset game state
        this.isPaused = false;
        this.gameOverState = false;
        
        // Adjust difficulty based on level
        this.maxEnemies = Math.min(5 + this.level, 10);
        this.enemySpawnRate = Math.max(3000 - (this.level * 300), 1000);
    }
    
    /**
     * Stop duel mode
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.removeKeyboardInput();
    }
    
    /**
     * Start the game loop
     */
    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Game loop
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.gameUI.drawBackground(this.ctx, this.canvas.width, this.canvas.height);
        
        if (!this.isPaused) {
            // Update game objects
            this.updateGameObjects(deltaTime);
            
            // Check collisions
            this.checkCollisions();
            
            // Spawn enemies and power-ups
            this.enemySpawnTimer += deltaTime;
            this.powerUpSpawnTimer += deltaTime;
            
            if (this.enemySpawnTimer >= this.enemySpawnRate && this.enemies.length < this.maxEnemies) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }
            
            if (this.powerUpSpawnTimer >= this.powerUpSpawnRate) {
                this.spawnPowerUp();
                this.powerUpSpawnTimer = 0;
            }
        }
        
        // Draw game objects
        this.drawGameObjects();
        
        // Draw duel-specific UI
        this.drawDuelUI();
        
        // Draw pause overlay if paused
        if (this.isPaused) {
            this.drawPauseOverlay();
        }
        
        // Draw game over screen if game is over
        if (this.gameOverState) {
            this.drawGameOver();
        } else {
            // Continue the game loop
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
        }
        
        // Handle escape key (return to menu)
        if (this.keys.escape) {
            this.keys.escape = false;
            this.stop();
            if (typeof this.onGameOver === 'function') {
                this.onGameOver();
            }
        }
        
        // Handle pause key
        if (this.keys.pause) {
            this.keys.pause = false;
            this.togglePause();
        }
    }
    
    /**
     * Update game objects
     */
    updateGameObjects(deltaTime) {
        // Update player 1 position based on input
        if (this.keys.p1Left) this.player1.x -= 5;
        if (this.keys.p1Right) this.player1.x += 5;
        if (this.keys.p1Up) this.player1.y -= 5;
        if (this.keys.p1Down) this.player1.y += 5;
        
        // Update player 2 position based on input
        if (this.keys.p2Left) this.player2.x -= 5;
        if (this.keys.p2Right) this.player2.x += 5;
        if (this.keys.p2Up) this.player2.y -= 5;
        if (this.keys.p2Down) this.player2.y += 5;
        
        // Keep players within canvas bounds
        this.player1.x = Math.max(20, Math.min(this.player1.x, this.canvas.width - 20));
        this.player1.y = Math.max(20, Math.min(this.player1.y, this.canvas.height - 20));
        this.player2.x = Math.max(20, Math.min(this.player2.x, this.canvas.width - 20));
        this.player2.y = Math.max(20, Math.min(this.player2.y, this.canvas.height - 20));
        
        // Change player 1 shape based on input
        if (this.keys.p1Circle) {
            this.player1 = this.changePlayerShape(this.player1, 'Circle');
            this.keys.p1Circle = false;
        } else if (this.keys.p1Triangle) {
            this.player1 = this.changePlayerShape(this.player1, 'Triangle');
            this.keys.p1Triangle = false;
        } else if (this.keys.p1Cube) {
            this.player1 = this.changePlayerShape(this.player1, 'Cube');
            this.keys.p1Cube = false;
        }
        
        // Change player 2 shape based on input
        if (this.keys.p2Circle) {
            this.player2 = this.changePlayerShape(this.player2, 'Circle');
            this.keys.p2Circle = false;
        } else if (this.keys.p2Triangle) {
            this.player2 = this.changePlayerShape(this.player2, 'Triangle');
            this.keys.p2Triangle = false;
        } else if (this.keys.p2Cube) {
            this.player2 = this.changePlayerShape(this.player2, 'Cube');
            this.keys.p2Cube = false;
        }
        
        // Fire projectiles for player 1
        if (this.keys.p1Fire) {
            this.fireProjectile(this.player1);
            this.keys.p1Fire = false;
        }
        
        // Fire projectiles for player 2
        if (this.keys.p2Fire) {
            this.fireProjectile(this.player2);
            this.keys.p2Fire = false;
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].move();
            
            // Remove projectiles that are out of bounds
            if (
                this.projectiles[i].x < 0 ||
                this.projectiles[i].x > this.canvas.width ||
                this.projectiles[i].y < 0 ||
                this.projectiles[i].y > this.canvas.height
            ) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let enemy of this.enemies) {
            enemy.move();
            
            // Bounce enemies off canvas edges
            if (enemy.x < 20 || enemy.x > this.canvas.width - 20) {
                enemy.dx *= -1;
            }
            if (enemy.y < 20 || enemy.y > this.canvas.height - 20) {
                enemy.dy *= -1;
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].move();
            
            // Remove power-ups after a certain time
            if (this.powerUps[i].lifetime <= 0) {
                this.powerUps.splice(i, 1);
            } else {
                this.powerUps[i].lifetime -= deltaTime;
            }
        }
    }
    
    /**
     * Draw game objects
     */
    drawGameObjects() {
        // Draw players
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }
        
        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
            
            // Draw enemy health bars
            const enemyBounds = { x: enemy.x - 20, y: enemy.y - 30, width: 40, height: 5 };
            
            // Match player shape advantage indicators
            const player1Match = this.player1.shapeType === enemy.shapeType;
            const player2Match = this.player2.shapeType === enemy.shapeType;
            
            this.gameUI.drawEnemyHealthBar(this.ctx, enemyBounds, enemy.health, enemy.maxHealth, player1Match || player2Match);
        }
        
        // Draw power-ups
        for (let powerUp of this.powerUps) {
            powerUp.draw(this.ctx);
        }
    }
    
    /**
     * Draw duel mode specific UI
     */
    drawDuelUI() {
        // Draw player 1 health bar (bottom)
        this.gameUI.drawHealthBar(
            this.ctx,
            this.player1.health,
            this.player1.maxHealth,
            20,
            this.canvas.height - 30,
            200
        );
        
        // Draw player 2 health bar (top)
        this.gameUI.drawHealthBar(
            this.ctx,
            this.player2.health,
            this.player2.maxHealth,
            20,
            20,
            200
        );
        
        // Draw player labels
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = COLORS.PLAYER_BLUE;
        this.ctx.fillText('P1: ' + this.player1.shapeType, 230, this.canvas.height - 16);
        
        this.ctx.fillStyle = COLORS.PLAYER_RED;
        this.ctx.fillText('P2: ' + this.player2.shapeType, 230, 34);
        
        // Draw level indicator
        this.ctx.fillStyle = COLORS.ACCENT;
        this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width - 100, 30);
    }
    
    /**
     * Draw pause overlay
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = '30px "Press Start 2P"';
        this.ctx.fillStyle = COLORS.ACCENT;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press ESC to exit', this.canvas.width / 2, this.canvas.height / 2 + 70);
        
        this.ctx.textAlign = 'left';
    }
    
    /**
     * Draw game over screen
     */
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = '30px "Press Start 2P"';
        this.ctx.fillStyle = COLORS.ACCENT;
        this.ctx.textAlign = 'center';
        
        // Show which player won
        if (this.player1.health <= 0 && this.player2.health <= 0) {
            this.ctx.fillText('DRAW!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        } else if (this.player1.health <= 0) {
            this.ctx.fillStyle = COLORS.PLAYER_RED;
            this.ctx.fillText('PLAYER 2 WINS!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        } else if (this.player2.health <= 0) {
            this.ctx.fillStyle = COLORS.PLAYER_BLUE;
            this.ctx.fillText('PLAYER 1 WINS!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        }
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.textAlign = 'left';
    }
    
    /**
     * Spawn an enemy
     */
    spawnEnemy() {
        // Random position within the canvas, avoiding player starting positions
        let x, y;
        const margin = 100;
        
        do {
            x = Math.random() * (this.canvas.width - 2 * margin) + margin;
            y = Math.random() * (this.canvas.height - 2 * margin) + margin;
        } while (
            (Math.abs(x - this.player1.x) < 100 && Math.abs(y - this.player1.y) < 100) ||
            (Math.abs(x - this.player2.x) < 100 && Math.abs(y - this.player2.y) < 100)
        );
        
        // Random enemy type
        const enemyType = this.levelObj.getRandomEnemyType();
        let enemy;
        
        switch (enemyType) {
            case 'Circle':
                enemy = new EnemyCircle(x, y);
                break;
            case 'Triangle':
                enemy = new EnemyTriangle(x, y);
                break;
            case 'Cube':
                enemy = new EnemyCube(x, y);
                break;
            default:
                enemy = new EnemyCircle(x, y);
        }
        
        // Scale enemy health and damage based on level
        enemy.maxHealth *= 1 + (this.level * 0.2);
        enemy.health = enemy.maxHealth;
        enemy.damage *= 1 + (this.level * 0.1);
        
        // Random movement direction
        enemy.dx = (Math.random() - 0.5) * 3;
        enemy.dy = (Math.random() - 0.5) * 3;
        
        this.enemies.push(enemy);
    }
    
    /**
     * Spawn a power-up
     */
    spawnPowerUp() {
        // Random position
        const x = Math.random() * (this.canvas.width - 40) + 20;
        const y = Math.random() * (this.canvas.height - 40) + 20;
        
        // Random power-up type
        const types = ['health', 'shield', 'speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerUp = new PowerUp(x, y, type);
        powerUp.lifetime = 10000; // Power-up disappears after 10 seconds
        
        this.powerUps.push(powerUp);
    }
    
    /**
     * Check collisions between game objects
     */
    checkCollisions() {
        // Player projectiles hitting enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Check collisions with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (projectile.collidesWith(enemy)) {
                    // Deal damage based on shape matching
                    let damage = projectile.damage;
                    
                    // Critical hit if shapes match
                    if (projectile.shapeType === enemy.shapeType) {
                        damage *= 2;
                    }
                    
                    enemy.health -= damage;
                    
                    // Remove destroyed enemies
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                    }
                    
                    // Remove the projectile
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
            
            // Check collisions with players (player projectiles can hit the other player)
            if (i >= 0) { // Check if projectile still exists
                const projectile = this.projectiles[i];
                
                // Player 2 projectiles hitting Player 1
                if (projectile.playerId === 2 && projectile.collidesWith(this.player1)) {
                    this.takeDamage(this.player1, projectile.damage);
                    this.projectiles.splice(i, 1);
                }
                
                // Player 1 projectiles hitting Player 2
                else if (projectile.playerId === 1 && projectile.collidesWith(this.player2)) {
                    this.takeDamage(this.player2, projectile.damage);
                    this.projectiles.splice(i, 1);
                }
            }
        }
        
        // Players colliding with enemies
        for (let enemy of this.enemies) {
            if (this.player1.collidesWith(enemy)) {
                this.takeDamage(this.player1, enemy.damage);
            }
            
            if (this.player2.collidesWith(enemy)) {
                this.takeDamage(this.player2, enemy.damage);
            }
        }
        
        // Players colliding with power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (this.player1.collidesWith(powerUp)) {
                this.applyPowerUp(this.player1, powerUp);
                this.powerUps.splice(i, 1);
            } else if (this.player2.collidesWith(powerUp)) {
                this.applyPowerUp(this.player2, powerUp);
                this.powerUps.splice(i, 1);
            }
        }
        
        // Check if either player has lost
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * Apply power-up effect
     */
    applyPowerUp(player, powerUp) {
        switch (powerUp.type) {
            case 'health':
                player.health = Math.min(player.health + 25, player.maxHealth);
                break;
            case 'shield':
                player.hasShield = true;
                // Shield lasts for 5 seconds
                setTimeout(() => {
                    player.hasShield = false;
                }, 5000);
                break;
            case 'speed':
                player.speedBoost = true;
                // Speed boost lasts for 5 seconds
                setTimeout(() => {
                    player.speedBoost = false;
                }, 5000);
                break;
        }
    }
    
    /**
     * Fire a projectile
     */
    fireProjectile(player) {
        const projectile = new Projectile(
            player.x,
            player.y,
            0,
            player.playerId === 1 ? -8 : 8, // Direction based on player ID
            player.shapeType,
            10
        );
        
        projectile.playerId = player.playerId;
        projectile.color = player.playerId === 1 ? COLORS.PLAYER_BLUE : COLORS.PLAYER_RED;
        
        this.projectiles.push(projectile);
    }
    
    /**
     * Change player shape
     */
    changePlayerShape(player, newShapeType) {
        const x = player.x;
        const y = player.y;
        const color = player.color;
        const playerId = player.playerId;
        const health = player.health;
        const maxHealth = player.maxHealth;
        const hasShield = player.hasShield;
        const speedBoost = player.speedBoost;
        
        let newShape;
        
        switch (newShapeType) {
            case 'Circle':
                newShape = new Circle(x, y);
                break;
            case 'Triangle':
                newShape = new Triangle(x, y);
                break;
            case 'Cube':
                newShape = new Cube(x, y);
                break;
            default:
                newShape = new Circle(x, y);
        }
        
        newShape.color = color;
        newShape.isPlayer = true;
        newShape.playerId = playerId;
        newShape.health = health;
        newShape.maxHealth = maxHealth;
        newShape.hasShield = hasShield;
        newShape.speedBoost = speedBoost;
        
        return newShape;
    }
    
    /**
     * Handle player taking damage
     */
    takeDamage(player, amount) {
        // Shield negates damage
        if (player.hasShield) {
            return;
        }
        
        player.health -= amount;
        
        // Check if player has lost
        if (player.health <= 0) {
            player.health = 0;
        }
    }
    
    /**
     * End the game
     */
    gameOver() {
        this.gameOverState = true;
        
        // Stop the game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Notify game over after a delay
        setTimeout(() => {
            if (typeof this.onGameOver === 'function') {
                // Return the winner
                let winner = 0; // Draw
                if (this.player1.health <= 0 && this.player2.health > 0) {
                    winner = 2; // Player 2 wins
                } else if (this.player2.health <= 0 && this.player1.health > 0) {
                    winner = 1; // Player 1 wins
                }
                
                this.onGameOver('duel', this.level, winner);
            }
        }, 3000);
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    /**
     * Set up keyboard input for duel mode
     */
    setupKeyboardInput() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    /**
     * Remove keyboard input listeners
     */
    removeKeyboardInput() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    /**
     * Handle keyboard input (keydown)
     */
    handleKeyDown(e) {
        // Prevent default actions for game keys
        if ([32, 37, 38, 39, 40, 65, 68, 83, 87, 70, 90, 88, 67, 49, 50, 51, 27, 80].includes(e.keyCode)) {
            e.preventDefault();
        }
        
        switch (e.keyCode) {
            // Player 1 Controls (Arrow Keys + Space + Numeric Keys)
            case 37: // Left arrow
                this.keys.p1Left = true;
                break;
            case 39: // Right arrow
                this.keys.p1Right = true;
                break;
            case 38: // Up arrow
                this.keys.p1Up = true;
                break;
            case 40: // Down arrow
                this.keys.p1Down = true;
                break;
            case 32: // Space
                this.keys.p1Fire = true;
                break;
            case 49: // 1 key
                this.keys.p1Circle = true;
                break;
            case 50: // 2 key
                this.keys.p1Triangle = true;
                break;
            case 51: // 3 key
                this.keys.p1Cube = true;
                break;
                
            // Player 2 Controls (WASD + F + ZXC)
            case 65: // A
                this.keys.p2Left = true;
                break;
            case 68: // D
                this.keys.p2Right = true;
                break;
            case 87: // W
                this.keys.p2Up = true;
                break;
            case 83: // S
                this.keys.p2Down = true;
                break;
            case 70: // F
                this.keys.p2Fire = true;
                break;
            case 90: // Z
                this.keys.p2Circle = true;
                break;
            case 88: // X
                this.keys.p2Triangle = true;
                break;
            case 67: // C
                this.keys.p2Cube = true;
                break;
                
            // Game Controls
            case 27: // Escape
                this.keys.escape = true;
                break;
            case 80: // P key
                this.keys.pause = true;
                break;
        }
    }
    
    /**
     * Handle keyboard input (keyup)
     */
    handleKeyUp(e) {
        switch (e.keyCode) {
            // Player 1 Controls
            case 37: // Left arrow
                this.keys.p1Left = false;
                break;
            case 39: // Right arrow
                this.keys.p1Right = false;
                break;
            case 38: // Up arrow
                this.keys.p1Up = false;
                break;
            case 40: // Down arrow
                this.keys.p1Down = false;
                break;
                
            // Player 2 Controls
            case 65: // A
                this.keys.p2Left = false;
                break;
            case 68: // D
                this.keys.p2Right = false;
                break;
            case 87: // W
                this.keys.p2Up = false;
                break;
            case 83: // S
                this.keys.p2Down = false;
                break;
        }
    }
}