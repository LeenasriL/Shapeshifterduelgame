/**
 * Combat Mode for ShapeShifterDuel
 * 
 * This mode is focused on intense combat with waves of enemies
 * and is now repurposed to serve as Single Player mode with 5 progressive levels.
 */
class CombatMode {
    constructor(canvas, onGameOver) {
        // Additional properties for single player mode
        this.playerMaxHealth = 100; // Default, will be adjusted based on level
        this.startingLevel = 1;     // Default, can be overridden when starting
        this.isInDuelMode = false;  // Flag to differentiate from duel mode
        // Canvas setup
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.onGameOver = onGameOver;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        
        // Game state
        this.playerHealth = 100;
        this.playerLives = 3;
        this.score = 0;
        this.waveNumber = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.isInvulnerable = false;
        this.isActive = false;
        this.playerSpeed = 8;
        
        // Combat mode timing variables
        this.lastShotTime = 0;
        this.lastEnemySpawnTime = 0;
        this.enemySpawnRate = 1500; // Initial spawn rate
        this.maxEnemiesPerWave = 5; // Initial max enemies per wave
        this.waveTimeout = null;
        this.invulnerableEndTime = 0;
        this.INVULNERABLE_DURATION = 1500;
        this.SHOT_DELAY = 200;
        
        // Wave progression
        this.enemiesDefeated = 0;
        this.enemiesRequiredForNextWave = 10;
        
        // UI
        this.gameUI = new GameUI();
        
        // Animation frame ID
        this.animationFrameId = null;
        
        // Setup event listeners for keyboard input
        this.setupKeyboardInput();
    }
    
    /**
     * Start combat mode
     */
    start() {
        // Reset game state
        this.resetGameState();
        this.isActive = true;
        
        // Start the game loop
        this.lastTime = 0;
        this.startGameLoop();
    }
    
    /**
     * Reset all game state for a new combat session
     */
    resetGameState() {
        this.player = new Circle(250, 400);
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        
        // Use custom health value if in single player mode with adjusted health
        this.playerHealth = this.playerMaxHealth || 100;
        this.playerLives = 3;
        this.score = 0;
        
        // Start at the specified level (for Single Player mode)
        this.waveNumber = this.startingLevel || 1;
        this.enemiesDefeated = 0;
        this.enemiesRequiredForNextWave = 10 + ((this.waveNumber - 1) * 5); // Increase enemies needed per level
        
        this.isGameOver = false;
        this.isPaused = false;
        this.isInvulnerable = false;
        
        // Adjust spawn rate and max enemies based on level
        this.enemySpawnRate = Math.max(1500 - ((this.waveNumber - 1) * 200), 500); // Faster spawns at higher levels
        this.maxEnemiesPerWave = 5 + ((this.waveNumber - 1) * 2); // More enemies at higher levels
        
        // Clear any existing wave timeout
        if (this.waveTimeout) {
            clearTimeout(this.waveTimeout);
            this.waveTimeout = null;
        }
    }
    
    /**
     * Stop combat mode
     */
    stop() {
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.waveTimeout) {
            clearTimeout(this.waveTimeout);
            this.waveTimeout = null;
        }
    }
    
    /**
     * Start the game loop
     */
    startGameLoop() {
        // Schedule first enemy spawn
        this.lastEnemySpawnTime = Date.now();
        
        // Start the game loop
        this.gameLoop(0);
    }
    
    /**
     * Game loop
     */
    gameLoop(timestamp) {
        if (!this.isActive) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.gameUI.drawBackground(this.ctx, this.width, this.height);
        
        // If game is paused, draw pause overlay and exit
        if (this.isPaused) {
            this.drawGameObjects();
            this.drawPauseOverlay();
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        if (this.isGameOver) {
            this.drawGameOver();
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Spawn enemies based on timing
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawnTime > this.enemySpawnRate && this.enemies.length < this.maxEnemiesPerWave) {
            this.spawnEnemy();
            this.lastEnemySpawnTime = currentTime;
        }
        
        // Update game objects
        this.updateGameObjects(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Check invulnerability timer
        if (this.isInvulnerable && Date.now() > this.invulnerableEndTime) {
            this.isInvulnerable = false;
        }
        
        // Draw game objects
        this.drawGameObjects();
        
        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Update game objects
     */
    updateGameObjects(deltaTime) {
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].move();
            
            // Remove enemies that go off screen
            if (this.enemies[i].y > this.height) {
                this.enemies.splice(i, 1);
                // Player loses a bit of health when an enemy escapes
                this.takeDamage(5);
            }
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].move();
            
            // Remove projectiles that go off screen
            if (this.projectiles[i].y < 0 || 
                this.projectiles[i].y > this.height ||
                this.projectiles[i].x < 0 ||
                this.projectiles[i].x > this.width) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].move();
            if (this.powerUps[i].y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    /**
     * Draw game objects
     */
    drawGameObjects() {
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
            this.gameUI.drawEnemyHealthBar(
                this.ctx,
                { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height },
                enemy.health,
                enemy.maxHealth,
                this.player.shapeType === enemy.shapeType
            );
        }
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }
        
        // Draw power-ups
        for (const powerUp of this.powerUps) {
            powerUp.draw(this.ctx);
        }
        
        // Draw UI elements for combat mode
        this.drawCombatUI();
        
        // Draw invulnerability effect
        if (this.isInvulnerable && Math.floor(Date.now() / 200) % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    }
    
    /**
     * Draw combat mode specific UI
     */
    drawCombatUI() {
        // Health bar with appropriate max health
        this.gameUI.drawHealthBar(
            this.ctx, 
            this.playerHealth, 
            this.playerMaxHealth || 100, // Use adjusted max health if provided 
            10, 
            this.height - 80, 
            200
        );
        
        // Determine if this is single player or combat mode
        const modeText = this.startingLevel > 1 ? `LEVEL ${this.startingLevel}` : `WAVE ${this.waveNumber}`;
        
        // Game stats
        this.ctx.fillStyle = GameColors.TEXT;
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText(modeText, 10, 25);
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 50);
        this.ctx.fillText(`LIVES: ${this.playerLives}`, 10, 75);
        this.ctx.fillText(`SHAPE: ${this.player.shapeType}`, 10, 100);
        
        // Progress bar
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(10, this.height - 60, 200, 8);
        
        // Calculate progress
        const progressWidth = Math.floor(200 * (this.enemiesDefeated / this.enemiesRequiredForNextWave));
        
        // Draw progress
        this.ctx.fillStyle = GameColors.ACCENT_YELLOW;
        this.ctx.fillRect(10, this.height - 60, progressWidth, 8);
        
        // Draw border
        this.ctx.strokeStyle = GameColors.TEXT;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, this.height - 60, 200, 8);
        
        // Progress text
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        
        const progressLabel = this.startingLevel > 1 ? "LEVEL PROGRESS" : "NEXT WAVE";
        this.ctx.fillText(`${progressLabel}: ${this.enemiesDefeated}/${this.enemiesRequiredForNextWave}`, 10, this.height - 40);
        
        // Controls reminder
        this.ctx.fillText('1-2-3: Change Shape   |   ARROWS: Move   |   SPACE: Fire', 10, this.height - 20);
    }
    
    /**
     * Draw pause overlay
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        
        // Title depends on mode
        const modeText = this.startingLevel > 1 ? 'SINGLE PLAYER MODE' : 'COMBAT MODE';
        const pausedText = `${modeText} PAUSED`;
        const textWidth = this.ctx.measureText(pausedText).width;
        this.ctx.fillText(pausedText, (this.width - textWidth) / 2, this.height / 2);
        
        this.ctx.font = '14px monospace';
        const resumeText = 'PRESS P TO RESUME';
        const resumeWidth = this.ctx.measureText(resumeText).width;
        this.ctx.fillText(resumeText, (this.width - resumeWidth) / 2, this.height / 2 + 30);
        
        const exitText = 'PRESS ESC TO EXIT';
        const exitWidth = this.ctx.measureText(exitText).width;
        this.ctx.fillText(exitText, (this.width - exitWidth) / 2, this.height / 2 + 60);
    }
    
    /**
     * Draw game over screen
     */
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.font = 'bold 30px monospace';
        this.ctx.fillStyle = GameColors.HEALTH_RED;
        
        // Title depends on mode
        const gameOverTitle = this.startingLevel > 1 ? 'GAME OVER' : 'COMBAT OVER';
        const textWidth = this.ctx.measureText(gameOverTitle).width;
        this.ctx.fillText(gameOverTitle, (this.width - textWidth) / 2, this.height / 2 - 30);
        
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        
        const scoreText = `FINAL SCORE: ${this.score}`;
        const scoreWidth = this.ctx.measureText(scoreText).width;
        this.ctx.fillText(scoreText, (this.width - scoreWidth) / 2, this.height / 2 + 10);
        
        // Level or wave text depends on mode
        const progressText = this.startingLevel > 1 
            ? `HIGHEST LEVEL: ${this.waveNumber}` 
            : `HIGHEST WAVE: ${this.waveNumber}`;
        
        const progressWidth = this.ctx.measureText(progressText).width;
        this.ctx.fillText(progressText, (this.width - progressWidth) / 2, this.height / 2 + 40);
        
        const restartText = 'PRESS ENTER TO RESTART';
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = GameColors.ACCENT_YELLOW;
        const restartWidth = this.ctx.measureText(restartText).width;
        this.ctx.fillText(restartText, (this.width - restartWidth) / 2, this.height / 2 + 80);
        
        const exitText = 'PRESS ESC TO EXIT';
        const exitWidth = this.ctx.measureText(exitText).width;
        this.ctx.fillText(exitText, (this.width - exitWidth) / 2, this.height / 2 + 110);
    }
    
    /**
     * Spawn an enemy
     */
    spawnEnemy() {
        // Don't spawn if paused or game over
        if (this.isPaused || this.isGameOver) return;
        
        const shapes = ["Circle", "Triangle", "Cube"];
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        const xPos = Math.floor(Math.random() * (this.width - 50));
        
        // Apply wave difficulty multipliers
        const healthMultiplier = 1.0 + (this.waveNumber - 1) * 0.2;
        const damageMultiplier = 1.0 + (this.waveNumber - 1) * 0.15;
        const speedMultiplier = 1.0 + (this.waveNumber - 1) * 0.1;
        
        let enemy = null;
        switch(shapeType) {
            case 'Circle':
                enemy = new EnemyCircle(xPos, 0);
                break;
            case 'Triangle':
                enemy = new EnemyTriangle(xPos, 0);
                break;
            case 'Cube':
                enemy = new EnemyCube(xPos, 0);
                break;
        }
        
        if (enemy) {
            // Apply wave modifiers
            const scaledMaxHealth = Math.floor(enemy.maxHealth * healthMultiplier);
            enemy.health = scaledMaxHealth;
            enemy.damage = Math.floor(enemy.damage * damageMultiplier);
            enemy.speed = enemy.speed * speedMultiplier;
            
            this.enemies.push(enemy);
        }
        
        // Occasionally spawn a power-up (10% chance)
        if (Math.random() < 0.1) {
            this.spawnPowerUp();
        }
    }
    
    /**
     * Spawn a power-up
     */
    spawnPowerUp() {
        const xPos = Math.floor(Math.random() * (this.width - 30));
        const types = ['Health', 'Shield', 'Speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push(new PowerUp(xPos, 0, type));
    }
    
    /**
     * Check collisions between game objects
     */
    checkCollisions() {
        // Player-enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Player-enemy collision
            if (this.player.collidesWith(enemy) && !this.isInvulnerable) {
                this.takeDamage(enemy.damage);
            }
        }
        
        // Projectile-enemy collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            let hit = false;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (projectile.collidesWith(enemy) && !hit) {
                    const isCritical = projectile.shapeType === enemy.shapeType;
                    const damage = isCritical ? enemy.maxHealth : projectile.damage;
                    
                    enemy.health -= damage;
                    hit = true;
                    
                    // Remove the projectile that hit
                    this.projectiles.splice(i, 1);
                    
                    if (enemy.health <= 0) {
                        // Award points based on enemy difficulty and critical hit
                        const pointsEarned = isCritical ? 20 * enemy.difficulty : 10 * enemy.difficulty;
                        this.score += pointsEarned;
                        
                        // Remove the defeated enemy
                        this.enemies.splice(j, 1);
                        
                        // Track enemy defeat for wave progression
                        this.enemiesDefeated++;
                        
                        // Check if we should advance to the next wave
                        if (this.enemiesDefeated >= this.enemiesRequiredForNextWave) {
                            this.advanceToNextWave();
                        }
                        
                        // 20% chance for defeated enemy to drop a power-up
                        if (Math.random() < 0.2) {
                            this.powerUps.push(new PowerUp(enemy.x, enemy.y, 'Health'));
                        }
                    }
                    
                    break;
                }
            }
        }
        
        // Player-powerup collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.player.collidesWith(powerUp)) {
                this.applyPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    /**
     * Apply power-up effect
     */
    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'Health':
                // Use the appropriate maximum health
                const maxHealth = this.playerMaxHealth || 100;
                this.playerHealth = Math.min(this.playerHealth + 25, maxHealth);
                break;
            case 'Shield':
                this.isInvulnerable = true;
                this.invulnerableEndTime = Date.now() + 5000; // 5 seconds of invulnerability
                break;
            case 'Speed':
                this.playerSpeed += 2; // Speed boost
                // Reset the speed after 10 seconds
                setTimeout(() => {
                    this.playerSpeed = Math.max(8, this.playerSpeed - 2);
                }, 10000);
                break;
        }
    }
    
    /**
     * Handle player taking damage
     */
    takeDamage(amount) {
        if (this.isInvulnerable) return;
        
        this.playerHealth -= amount;
        this.isInvulnerable = true;
        this.invulnerableEndTime = Date.now() + this.INVULNERABLE_DURATION;
        
        if (this.playerHealth <= 0) {
            this.playerLives--;
            
            // Use appropriate max health
            this.playerHealth = this.playerMaxHealth || 100;
            
            if (this.playerLives <= 0) {
                this.gameOver();
            }
        }
    }
    
    /**
     * Advance to the next wave
     */
    advanceToNextWave() {
        this.waveNumber++;
        this.enemiesDefeated = 0;
        
        // Increase difficulty for the next wave
        this.enemiesRequiredForNextWave = 10 + (this.waveNumber - 1) * 5;
        this.enemySpawnRate = Math.max(1500 - (this.waveNumber - 1) * 100, 300);
        this.maxEnemiesPerWave = 5 + Math.floor(this.waveNumber / 2);
        
        // Show wave announcement
        this.announcementText = `WAVE ${this.waveNumber}`;
        this.announcementTime = Date.now();
        
        // Award bonus points for completing a wave
        this.score += this.waveNumber * 50;
        
        // Clear all enemies and give a short breather
        this.enemies = [];
        
        // Pause enemy spawning for a moment
        this.lastEnemySpawnTime = Date.now() + 2000;
    }
    
    /**
     * End the game
     */
    gameOver() {
        this.isGameOver = true;
        
        // If there's a callback for game over, call it
        if (typeof this.onGameOver === 'function') {
            this.onGameOver(this.score, this.waveNumber);
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    /**
     * Set up keyboard input for combat mode
     */
    setupKeyboardInput() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        // Only process keys if combat mode is active
        if (!this.isActive) return;
        
        // Process restart on game over
        if (this.isGameOver) {
            if (e.key === 'Enter') {
                this.resetGameState();
            } else if (e.key === 'Escape') {
                this.stop();
                // The caller will handle exiting combat mode
            }
            return;
        }
        
        // Toggle pause on P key
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        
        // Exit combat mode on Escape if paused
        if (e.key === 'Escape' && this.isPaused) {
            this.stop();
            // The caller will handle exiting combat mode
            return;
        }
        
        // Don't process other keys if paused
        if (this.isPaused) return;
        
        // Movement
        if (e.key === 'ArrowLeft' && this.player.x > 0) this.player.x -= this.playerSpeed;
        if (e.key === 'ArrowRight' && this.player.x < this.width - this.player.width) this.player.x += this.playerSpeed;
        if (e.key === 'ArrowUp' && this.player.y > 0) this.player.y -= this.playerSpeed;
        if (e.key === 'ArrowDown' && this.player.y < this.height - this.player.height) this.player.y += this.playerSpeed;
        
        // Shooting
        if (e.key === ' ' || e.key === 'Spacebar') {
            const currentTime = Date.now();
            if (currentTime - this.lastShotTime > this.SHOT_DELAY) {
                const shapeType = this.player.shapeType;
                
                // Base firing pattern - adapted for combat mode
                const centerX = this.player.x + this.player.width / 2 - 2;
                
                // Basic shot pattern
                this.projectiles.push(new Projectile(centerX, this.player.y, 0, -20, shapeType, 5));
                
                // Enhanced patterns for higher waves
                if (this.waveNumber >= 2) {
                    this.projectiles.push(new Projectile(centerX - 8, this.player.y, 0, -20, shapeType, 5));
                    this.projectiles.push(new Projectile(centerX + 8, this.player.y, 0, -20, shapeType, 5));
                }
                
                if (this.waveNumber >= 4) {
                    this.projectiles.push(new Projectile(centerX - 12, this.player.y, -2, -18, shapeType, 5));
                    this.projectiles.push(new Projectile(centerX + 12, this.player.y, 2, -18, shapeType, 5));
                }
                
                if (this.waveNumber >= 6) {
                    this.projectiles.push(new Projectile(centerX - 16, this.player.y, -4, -16, shapeType, 5));
                    this.projectiles.push(new Projectile(centerX + 16, this.player.y, 4, -16, shapeType, 5));
                }
                
                this.lastShotTime = currentTime;
            }
        }
        
        // Shape shifting
        if (e.key === '1') this.player = new Circle(this.player.x, this.player.y);
        if (e.key === '2') this.player = new Triangle(this.player.x, this.player.y);
        if (e.key === '3') this.player = new Cube(this.player.x, this.player.y);
    }
}