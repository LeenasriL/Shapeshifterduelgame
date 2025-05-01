/**
 * ShapeShifterDuel - a level-based game with varying health points
 * for different difficulty levels and retro-style UI.
 * Now with Single Player and Duel modes.
 */
class ShapeShifterDuel {
    constructor() {
        // Set up canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        
        // Game state
        this.playerHealth = 0;
        this.playerLives = 3;
        this.score = 0;
        this.isGameOver = false;
        this.isGamePaused = false;
        this.isInvulnerable = false;
        this.isGameStarted = false;
        this.playerSpeed = 8;
        
        // Game mode
        this.gameMode = 'menu'; // 'menu', 'single', 'duel'
        
        // Level management
        this.currentLevel = null;
        this.highestLevelReached = 1;
        this.levelTransition = new LevelTransition();
        
        // Game modes
        this.singlePlayerMode = new CombatMode(this.canvas, this.onSinglePlayerGameOver.bind(this));
        this.duelMode = new DuelMode(this.canvas, this.onDuelGameOver.bind(this));
        
        // Timing variables
        this.lastShotTime = 0;
        this.SHOT_DELAY = 200;
        this.invulnerableEndTime = 0;
        this.INVULNERABLE_DURATION = 1500;
        this.lastEnemySpawnTime = 0;
        
        // UI
        this.gameUI = new GameUI();
        
        // Set up event listeners for keyboard input
        this.setupKeyboardInput();
        
        // Start the game loop
        this.lastTime = 0;
        this.gameLoop(0);
        
        // Expose game instance globally
        window.game = this;
    }
    
    /**
     * Callback for when single player mode ends
     */
    onSinglePlayerGameOver(score, level) {
        // Update user high score if logged in
        this.updateUserStats(score, level);
        
        // Display game over event
        const gameOverEvent = new CustomEvent('game-over', {
            detail: {
                mode: 'single',
                score: score,
                level: level,
                message: `Game Over! You reached level ${level} with a score of ${score}.`
            }
        });
        window.dispatchEvent(gameOverEvent);
    }
    
    /**
     * Callback for when duel mode ends
     */
    onDuelGameOver(mode, level, winner) {
        // Display game over event
        let message = '';
        if (winner === 0) {
            message = 'Game Over! It\'s a draw!';
        } else {
            message = `Game Over! Player ${winner} wins!`;
        }
        
        const gameOverEvent = new CustomEvent('game-over', {
            detail: {
                mode: 'duel',
                level: level,
                winner: winner,
                message: message
            }
        });
        window.dispatchEvent(gameOverEvent);
    }
    
    /**
     * Update user stats when game ends
     */
    updateUserStats(score, level) {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                let userData = JSON.parse(currentUser);
                
                // Update high score if new score is higher
                if (score > userData.highScore) {
                    userData.highScore = score;
                }
                
                // Update level if new level is higher
                if (level > userData.level) {
                    userData.level = level;
                }
                
                // Save updated user data
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Update users array
                let users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(u => u.id === userData.id);
                
                if (userIndex >= 0) {
                    users[userIndex].highScore = userData.highScore;
                    users[userIndex].level = userData.level;
                    localStorage.setItem('users', JSON.stringify(users));
                }
            } catch (e) {
                console.error('Error updating user stats:', e);
            }
        }
    }
    
    /**
     * Start single player mode at a specific level
     */
    startSinglePlayerGame(level = 1) {
        this.gameMode = 'single';
        
        // Adjust health based on level
        const healthMultiplier = 1 - ((level - 1) * 0.15); // 15% less health per level
        const baseHealth = 100;
        const adjustedHealth = Math.max(baseHealth * healthMultiplier, 40); // Minimum 40 health
        
        // Configure combat mode (reused for single player mode)
        this.singlePlayerMode.playerMaxHealth = adjustedHealth;
        this.singlePlayerMode.startingLevel = level;
        this.singlePlayerMode.isInDuelMode = false;
        
        // Start the game
        this.singlePlayerMode.start();
    }
    
    /**
     * Start duel mode at a specific level
     */
    startDuelGame(level = 1) {
        this.gameMode = 'duel';
        this.duelMode.start(level);
    }
    
    /**
     * Stop the current game
     */
    stopGame() {
        if (this.gameMode === 'single') {
            this.singlePlayerMode.stop();
        } else if (this.gameMode === 'duel') {
            this.duelMode.stop();
        } else if (this.gameMode === 'combat') {
            this.combatMode.stop();
        } else if (this.gameMode === 'adventure') {
            // Reset adventure mode
            this.isGameStarted = false;
            this.isGameOver = true;
        }
        
        this.gameMode = 'menu';
    }
    
    /**
     * Show the main menu screen.
     */
    showMainMenu() {
        this.isGameStarted = false;
        this.gameMode = 'menu';
    }
    
    /**
     * Draw the main menu.
     */
    drawMainMenu(timestamp) {
        // Title
        this.ctx.font = 'bold 36px monospace';
        this.ctx.fillStyle = GameColors.ACCENT_YELLOW;
        let title = 'SHAPE SHIFTER DUEL';
        let textWidth = this.ctx.measureText(title).width;
        this.ctx.fillText(title, (this.width - textWidth) / 2, this.height / 4);
        
        // Game mode options
        this.ctx.font = 'bold 18px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        
        // Draw mode selection boxes
        const boxWidth = 240;
        const boxHeight = 100;
        const boxMargin = 20;
        
        // Single Player Mode Box
        const singleBoxX = (this.width - boxWidth * 2 - boxMargin) / 2;
        const modeBoxY = this.height / 2;
        
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(singleBoxX, modeBoxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = GameColors.ACCENT_YELLOW;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(singleBoxX, modeBoxY, boxWidth, boxHeight);
        
        // Single Player Mode Text
        this.ctx.fillStyle = GameColors.TEXT;
        const singleTitle = 'SINGLE PLAYER';
        textWidth = this.ctx.measureText(singleTitle).width;
        this.ctx.fillText(singleTitle, singleBoxX + (boxWidth - textWidth) / 2, modeBoxY + 30);
        
        this.ctx.font = '12px monospace';
        const singleDesc = '5 levels with increasing difficulty';
        textWidth = this.ctx.measureText(singleDesc).width;
        this.ctx.fillText(singleDesc, singleBoxX + (boxWidth - textWidth) / 2, modeBoxY + 60);
        
        // Press S
        if (Math.floor(timestamp / 500) % 2 === 0) {
            this.ctx.fillStyle = GameColors.SUCCESS_GREEN;
            const pressS = 'PRESS S';
            textWidth = this.ctx.measureText(pressS).width;
            this.ctx.fillText(pressS, singleBoxX + (boxWidth - textWidth) / 2, modeBoxY + 85);
        }
        
        // Duel Mode Box
        const duelBoxX = singleBoxX + boxWidth + boxMargin;
        
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(duelBoxX, modeBoxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = GameColors.HEALTH_RED;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(duelBoxX, modeBoxY, boxWidth, boxHeight);
        
        // Duel Mode Text
        this.ctx.fillStyle = GameColors.TEXT;
        this.ctx.font = 'bold 18px monospace';
        const duelTitle = 'DUEL PLAYER';
        textWidth = this.ctx.measureText(duelTitle).width;
        this.ctx.fillText(duelTitle, duelBoxX + (boxWidth - textWidth) / 2, modeBoxY + 30);
        
        this.ctx.font = '12px monospace';
        const duelDesc = 'Two-player competitive mode';
        textWidth = this.ctx.measureText(duelDesc).width;
        this.ctx.fillText(duelDesc, duelBoxX + (boxWidth - textWidth) / 2, modeBoxY + 60);
        
        // Press D
        if (Math.floor(timestamp / 500) % 2 === 0) {
            this.ctx.fillStyle = GameColors.SUCCESS_GREEN;
            const pressD = 'PRESS D';
            textWidth = this.ctx.measureText(pressD).width;
            this.ctx.fillText(pressD, duelBoxX + (boxWidth - textWidth) / 2, modeBoxY + 85);
        }
        
        // Level selection (only appears if a mode is being chosen)
        if (this.choosingLevel) {
            this.drawLevelSelection(timestamp);
        }
        
        // Controls info at bottom
        this.ctx.fillStyle = GameColors.TEXT;
        this.ctx.font = '12px monospace';
        const controlsText = 'Use S for Single Player or D for Duel Player';
        textWidth = this.ctx.measureText(controlsText).width;
        this.ctx.fillText(controlsText, (this.width - textWidth) / 2, this.height - 40);
    }
    
    /**
     * Draw level selection UI
     */
    drawLevelSelection(timestamp) {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Title
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillStyle = GameColors.ACCENT_YELLOW;
        const title = this.pendingGameMode === 'single' ? 
            'SELECT SINGLE PLAYER LEVEL' : 
            'SELECT DUEL PLAYER LEVEL';
        const textWidth = this.ctx.measureText(title).width;
        this.ctx.fillText(title, (this.width - textWidth) / 2, this.height / 3);
        
        // Level boxes
        const boxSize = 60;
        const boxMargin = 20;
        const totalWidth = (boxSize * 5) + (boxMargin * 4);
        let startX = (this.width - totalWidth) / 2;
        const boxY = this.height / 2;
        
        for (let level = 1; level <= 5; level++) {
            const boxX = startX + ((level - 1) * (boxSize + boxMargin));
            
            // Draw box
            this.ctx.fillStyle = level === this.pendingLevel ? GameColors.SUCCESS_GREEN : '#333333';
            this.ctx.fillRect(boxX, boxY, boxSize, boxSize);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(boxX, boxY, boxSize, boxSize);
            
            // Draw level number
            this.ctx.font = 'bold 24px monospace';
            this.ctx.fillStyle = '#FFFFFF';
            const levelText = level.toString();
            const levelWidth = this.ctx.measureText(levelText).width;
            this.ctx.fillText(levelText, boxX + (boxSize - levelWidth) / 2, boxY + 35);
        }
        
        // Health indicator for Single Player mode
        if (this.pendingGameMode === 'single' && this.pendingLevel) {
            const healthMultiplier = 1 - ((this.pendingLevel - 1) * 0.15);
            const baseHealth = 100;
            const adjustedHealth = Math.max(baseHealth * healthMultiplier, 40);
            
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = GameColors.HEALTH_RED;
            const healthText = `Health: ${Math.round(adjustedHealth)}%`;
            const healthWidth = this.ctx.measureText(healthText).width;
            this.ctx.fillText(healthText, (this.width - healthWidth) / 2, boxY + boxSize + 30);
        }
        
        // Instructions
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        
        // Press 1-5 to select level
        const instructionText = 'Press 1-5 to select level';
        const instrWidth = this.ctx.measureText(instructionText).width;
        this.ctx.fillText(instructionText, (this.width - instrWidth) / 2, boxY + boxSize + 60);
        
        // Press Enter to start
        if (this.pendingLevel) {
            if (Math.floor(timestamp / 500) % 2 === 0) {
                this.ctx.fillStyle = GameColors.SUCCESS_GREEN;
                const startText = 'Press ENTER to start';
                const startWidth = this.ctx.measureText(startText).width;
                this.ctx.fillText(startText, (this.width - startWidth) / 2, boxY + boxSize + 90);
            }
        }
        
        // Press Escape to cancel
        this.ctx.fillStyle = GameColors.TEXT;
        const cancelText = 'Press ESC to cancel';
        const cancelWidth = this.ctx.measureText(cancelText).width;
        this.ctx.fillText(cancelText, (this.width - cancelWidth) / 2, boxY + boxSize + 120);
    }
    
    /**
     * Start adventure mode (level-based game).
     */
    startAdventureMode() {
        this.isGameStarted = true;
        this.isGameOver = false;
        this.gameMode = 'adventure';
        
        // Reset game state
        this.playerLives = 3;
        this.score = 0;
        this.currentLevel = new Level(1);
        this.highestLevelReached = 1;
        this.playerHealth = this.currentLevel.playerMaxHealth;
        
        // Clear game objects
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        
        // Reset player position
        this.player = new Circle(250, 400);
    }
    
    /**
     * Start combat mode.
     */
    startCombatMode() {
        this.gameMode = 'combat';
        this.combatMode.start();
    }
    
    /**
     * Return to main menu.
     */
    returnToMainMenu() {
        // Stop combat mode if active
        if (this.gameMode === 'combat') {
            this.combatMode.stop();
        }
        
        this.showMainMenu();
    }
    
    /**
     * Advance to the next level.
     */
    advanceToNextLevel() {
        const nextLevelNumber = this.currentLevel.levelNumber + 1;
        
        // Update highest level reached
        if (nextLevelNumber > this.highestLevelReached) {
            this.highestLevelReached = nextLevelNumber;
        }
        
        // Create the next level
        const nextLevel = new Level(nextLevelNumber);
        
        // Transition to the next level
        this.levelTransition.startTransition(this.currentLevel, nextLevel, () => {
            // After transition is complete
            this.currentLevel = nextLevel;
            this.playerHealth = this.currentLevel.playerMaxHealth;
            
            // Clear all enemies and reset player position
            this.enemies = [];
            this.player.x = 250;
            this.player.y = 400;
        });
    }
    
    /**
     * Game loop.
     */
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.gameUI.drawBackground(this.ctx, this.width, this.height);
        
        // Handle different game modes
        if (this.gameMode === 'menu') {
            // Draw main menu screen
            this.drawMainMenu(timestamp);
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        } else if (this.gameMode === 'combat') {
            // In combat mode, let the combat mode component handle the rendering
            // (The combat mode's game loop is run by its own start method)
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Below is the adventure (level-based) mode logic
        
        if (!this.isGameStarted) {
            this.gameUI.drawStartScreen(this.ctx, this.width, this.height, timestamp);
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        if (this.isGameOver) {
            this.gameUI.drawGameOverScreen(this.ctx, this.width, this.height, this.score, this.highestLevelReached);
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // If game is paused, draw pause overlay and exit
        if (this.isGamePaused) {
            this.drawGameObjects();
            this.drawPauseOverlay();
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Check level transition
        if (this.levelTransition.isTransitioning) {
            this.levelTransition.update(timestamp);
            this.drawGameObjects();
            this.levelTransition.draw(this.ctx, this.width, this.height);
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Spawn enemies based on level's spawn rate
        if (timestamp - this.lastEnemySpawnTime > this.currentLevel.enemySpawnRate) {
            this.spawnEnemy();
            this.lastEnemySpawnTime = timestamp;
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
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Update game objects.
     */
    updateGameObjects(deltaTime) {
        // Update enemies
        for (let enemy of this.enemies) {
            enemy.move();
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].move();
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
     * Draw game objects.
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
        
        // Draw UI elements
        this.gameUI.drawHealthBar(
            this.ctx,
            this.playerHealth,
            this.currentLevel.playerMaxHealth,
            10,
            this.height - 80,
            200
        );
        
        this.gameUI.drawLevelProgressBar(
            this.ctx,
            this.currentLevel,
            10,
            this.height - 60,
            200
        );
        
        this.gameUI.drawGameStats(
            this.ctx,
            this.currentLevel,
            this.score,
            this.playerLives,
            this.player.shapeType
        );
        
        // Draw invulnerability effect
        if (this.isInvulnerable && Math.floor(Date.now() / 200) % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    }
    
    /**
     * Draw pause overlay.
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillStyle = GameColors.TEXT;
        let pausedText = 'GAME PAUSED';
        let textWidth = this.ctx.measureText(pausedText).width;
        this.ctx.fillText(pausedText, (this.width - textWidth) / 2, this.height / 2);
        
        this.ctx.font = '12px monospace';
        let resumeText = 'PRESS P TO RESUME';
        textWidth = this.ctx.measureText(resumeText).width;
        this.ctx.fillText(resumeText, (this.width - textWidth) / 2, this.height / 2 + 30);
    }
    
    /**
     * Spawn a new enemy based on the current level.
     */
    spawnEnemy() {
        if (!this.isGameStarted || this.isGameOver || this.isGamePaused || this.levelTransition.isTransitioning) {
            return;
        }
        
        const shapeType = this.currentLevel.getRandomEnemyType();
        const xPos = this.currentLevel.getRandomEnemyPosition(this.width - 50);
        
        // Apply level multipliers for health and damage
        const healthMultiplier = this.currentLevel.enemyHealthMultiplier;
        const damageMultiplier = this.currentLevel.enemyDamageMultiplier;
        const speedMultiplier = this.currentLevel.enemySpeedMultiplier;
        
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
            // Apply level modifiers
            // Scale health based on level multiplier (maxHealth is final so we can't change it)
            const scaledMaxHealth = Math.floor(enemy.maxHealth * healthMultiplier);
            enemy.health = scaledMaxHealth;  // Set current health to the scaled max health
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
     * Spawn a power-up at a random position.
     */
    spawnPowerUp() {
        const xPos = Math.floor(Math.random() * (this.width - 30));
        const types = ['Health', 'Shield', 'Speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push(new PowerUp(xPos, 0, type));
    }
    
    /**
     * Check collisions between game objects.
     */
    checkCollisions() {
        // Check player-enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Player-enemy collision
            if (this.player.collidesWith(enemy) && !this.isInvulnerable) {
                this.takeDamage(enemy.damage);
            }
            
            // Enemy reached bottom of screen
            if (enemy.y > this.height) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Check projectile-enemy collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            let projectileRemoved = false;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (projectile.collidesWith(enemy) && !projectileRemoved) {
                    const isCritical = projectile.shapeType === enemy.shapeType;
                    const damage = isCritical ? enemy.maxHealth : projectile.damage;
                    
                    enemy.health -= damage;
                    this.projectiles.splice(i, 1);
                    projectileRemoved = true;
                    
                    if (enemy.health <= 0) {
                        const pointsEarned = isCritical ? 20 * enemy.difficulty : 10 * enemy.difficulty;
                        this.score += pointsEarned;
                        
                        // Check for level completion
                        if (this.currentLevel.addPoints(pointsEarned)) {
                            this.advanceToNextLevel();
                        }
                        
                        this.enemies.splice(j, 1);
                        
                        // 20% chance to drop a power-up on enemy death
                        if (Math.random() < 0.2) {
                            this.powerUps.push(new PowerUp(enemy.x, enemy.y, 'Health'));
                        }
                    }
                    
                    break;
                }
            }
        }
        
        // Check player-powerup collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.player.collidesWith(powerUp)) {
                this.applyPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    /**
     * Apply the effect of a power-up.
     * 
     * @param {PowerUp} powerUp The power-up to apply
     */
    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'Health':
                this.playerHealth = Math.min(this.playerHealth + 25, this.currentLevel.playerMaxHealth);
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
     * Handle player taking damage.
     * 
     * @param {number} amount The amount of damage to take
     */
    takeDamage(amount) {
        this.playerHealth -= amount;
        this.isInvulnerable = true;
        this.invulnerableEndTime = Date.now() + this.INVULNERABLE_DURATION;
        
        if (this.playerHealth <= 0) {
            this.playerLives--;
            this.playerHealth = this.currentLevel.playerMaxHealth;
            if (this.playerLives <= 0) {
                this.gameOver();
            }
        }
    }
    
    /**
     * End the game.
     */
    gameOver() {
        this.isGameOver = true;
    }
    
    /**
     * Toggle the game pause state.
     */
    togglePause() {
        this.isGamePaused = !this.isGamePaused;
    }
    
    /**
     * Set up keyboard input.
     */
    setupKeyboardInput() {
        // Add properties for level selection
        this.choosingLevel = false;
        this.pendingGameMode = null;
        this.pendingLevel = null;
        
        document.addEventListener('keydown', (e) => {
            // Main menu controls
            if (this.gameMode === 'menu') {
                // Level selection screen handling
                if (this.choosingLevel) {
                    if (e.key === 'Escape') {
                        // Cancel level selection
                        this.choosingLevel = false;
                        this.pendingGameMode = null;
                        this.pendingLevel = null;
                        return;
                    }
                    
                    // Level selection (1-5)
                    const levelNum = parseInt(e.key);
                    if (levelNum >= 1 && levelNum <= 5) {
                        this.pendingLevel = levelNum;
                        return;
                    }
                    
                    // Start game with selected level
                    if (e.key === 'Enter' && this.pendingLevel) {
                        if (this.pendingGameMode === 'single') {
                            this.startSinglePlayerGame(this.pendingLevel);
                        } else if (this.pendingGameMode === 'duel') {
                            this.startDuelGame(this.pendingLevel);
                        }
                        
                        // Reset level selection state
                        this.choosingLevel = false;
                        this.pendingGameMode = null;
                        this.pendingLevel = null;
                    }
                    
                    return;
                }
                
                // Main menu options
                if (e.key === 's' || e.key === 'S') {
                    // Enter Single Player mode level selection
                    this.choosingLevel = true;
                    this.pendingGameMode = 'single';
                    this.pendingLevel = 1; // Default level
                    return;
                }
                
                if (e.key === 'd' || e.key === 'D') {
                    // Enter Duel Player mode level selection
                    window.location.href = 'duel_game.html';
                }

            

                
                // Legacy mode mappings (for backward compatibility)
                if (e.key === 'a' || e.key === 'A') {
                    this.startAdventureMode();
                    return;
                }
                
                if (e.key === 'c' || e.key === 'C') {
                    this.startCombatMode();
                    return;
                }
                
                return;
            }
            
            // Adventure mode controls
            if (this.gameMode === 'adventure') {
                // Return to main menu on Escape key
                if (e.key === 'Escape') {
                    this.returnToMainMenu();
                    return;
                }
                
                // Restart game on Enter key if game over
                if (this.isGameOver && e.key === 'Enter') {
                    this.startAdventureMode();
                    return;
                }
                
                // Pause/unpause on P key
                if (e.key === 'p' && this.isGameStarted && !this.isGameOver) {
                    this.togglePause();
                    return;
                }
                
                // Don't process other keys if game is paused, not started, or over or in level transition
                if (this.isGamePaused || !this.isGameStarted || this.isGameOver || this.levelTransition.isTransitioning) {
                    return;
                }
            }
            
            // Combat mode key handling is done in the combatMode class
            if (this.gameMode === 'combat') {
                return;
            }
            
            // Movement
            if (e.key === 'ArrowLeft' && this.player.x > 0)
                this.player.x -= this.playerSpeed;
            if (e.key === 'ArrowRight' && this.player.x < this.width - this.player.width)
                this.player.x += this.playerSpeed;
            if (e.key === 'ArrowUp' && this.player.y > 0)
                this.player.y -= this.playerSpeed;
            if (e.key === 'ArrowDown' && this.player.y < this.height - this.player.height)
                this.player.y += this.playerSpeed;
            
            // Shooting
            if (e.key === ' ' || e.key === 'Spacebar') {
                const currentTime = Date.now();
                if (currentTime - this.lastShotTime > this.SHOT_DELAY) {
                    const shapeType = this.player.shapeType;
                    
                    // Fire a spread of bullets based on current level
                    const centerX = this.player.x + this.player.width / 2 - 2;
                    
                    // Base projectile pattern
                    this.projectiles.push(new Projectile(centerX, this.player.y, 0, -20, shapeType, 5));
                    
                    // Add more projectiles for higher levels
                    if (this.currentLevel.levelNumber >= 2) {
                        this.projectiles.push(new Projectile(centerX - 8, this.player.y, 0, -20, shapeType, 5));
                        this.projectiles.push(new Projectile(centerX + 8, this.player.y, 0, -20, shapeType, 5));
                    }
                    
                    if (this.currentLevel.levelNumber >= 3) {
                        this.projectiles.push(new Projectile(centerX - 4, this.player.y - 5, 0, -20, shapeType, 5));
                        this.projectiles.push(new Projectile(centerX + 4, this.player.y - 5, 0, -20, shapeType, 5));
                    }
                    
                    if (this.currentLevel.levelNumber >= 5) {
                        this.projectiles.push(new Projectile(centerX - 12, this.player.y, -1, -19, shapeType, 5));
                        this.projectiles.push(new Projectile(centerX + 12, this.player.y, 1, -19, shapeType, 5));
                    }
                    
                    this.lastShotTime = currentTime;
                }
            }
            
            // Shape shifting
            if (e.key === '1') this.player = new Circle(this.player.x, this.player.y);
            if (e.key === '2') this.player = new Triangle(this.player.x, this.player.y);
            if (e.key === '3') this.player = new Cube(this.player.x, this.player.y);
        });
    }
}

/**
 * Base class for all shapes in the game.
 */
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
        // Abstract method, implemented by subclasses
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

/**
 * Circle shape.
 */
class Circle extends Shape {
    constructor(x, y) {
        super(x, y, GameColors.PLAYER_CIRCLE, 'Circle');
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Triangle shape.
 */
class Triangle extends Shape {
    constructor(x, y) {
        super(x, y, GameColors.PLAYER_TRIANGLE, 'Triangle');
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * Cube shape.
 */
class Cube extends Shape {
    constructor(x, y) {
        super(x, y, GameColors.PLAYER_CUBE, 'Cube');
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Base class for enemy shapes.
 */
class Enemy extends Shape {
    constructor(x, y, color, shapeType, maxHealth, damage, difficulty) {
        super(x, y, color, shapeType);
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.damage = damage;
        this.difficulty = difficulty;
        this.speed = 2.0;
        this.yFloat = y;
    }
    
    move() {
        this.yFloat += this.speed;
        this.y = Math.floor(this.yFloat);
    }
}

/**
 * Circle enemy.
 */
class EnemyCircle extends Enemy {
    constructor(x, y) {
        super(x, y, GameColors.ENEMY_CIRCLE, 'Circle', 30, 5, 1);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Triangle enemy.
 */
class EnemyTriangle extends Enemy {
    constructor(x, y) {
        super(x, y, GameColors.ENEMY_TRIANGLE, 'Triangle', 40, 8, 2);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * Cube enemy.
 */
class EnemyCube extends Enemy {
    constructor(x, y) {
        super(x, y, GameColors.ENEMY_CUBE, 'Cube', 50, 10, 3);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Projectile fired by the player.
 */
class Projectile {
    constructor(x, y, dx, dy, shapeType, damage) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.shapeType = shapeType;
        this.damage = damage;
        this.width = 5;
        this.height = 5;
    }
    
    move() {
        this.x += this.dx;
        this.y += this.dy;
    }
    
    draw(ctx) {
        // Color based on shape type
        switch (this.shapeType) {
            case 'Circle':
                ctx.fillStyle = GameColors.PLAYER_CIRCLE;
                break;
            case 'Triangle':
                ctx.fillStyle = GameColors.PLAYER_TRIANGLE;
                break;
            case 'Cube':
                ctx.fillStyle = GameColors.PLAYER_CUBE;
                break;
            default:
                ctx.fillStyle = '#FFFFFF';
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    collidesWith(other) {
        return this.x >= other.x && this.x <= other.x + other.width &&
               this.y >= other.y && this.y <= other.y + other.height;
    }
}

/**
 * Power-up item that can be collected by the player.
 */
class PowerUp extends Shape {
    constructor(x, y, type) {
        super(x, y, getPowerUpColor(type), 'PowerUp');
        this.type = type;
        this.width = 15;
        this.height = 15;
        this.yFloat = y;
        this.ySpeed = 1.5;
        
        function getPowerUpColor(type) {
            switch (type) {
                case 'Health':
                    return GameColors.SUCCESS_GREEN;
                case 'Shield':
                    return GameColors.ACCENT_YELLOW;
                case 'Speed':
                    return '#7FDBFF'; // Light blue
                default:
                    return '#FFFFFF';
            }
        }
    }
    
    move() {
        this.yFloat += this.ySpeed;
        this.y = Math.floor(this.yFloat);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        switch (this.type) {
            case 'Health':
                // Health power-up (cross shape)
                ctx.fillRect(this.x + 5, this.y, 5, 15);
                ctx.fillRect(this.x, this.y + 5, 15, 5);
                break;
            case 'Shield':
                // Shield power-up (shield shape)
                ctx.beginPath();
                ctx.arc(this.x + 7.5, this.y + 7.5, 7.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = GameColors.BACKGROUND;
                ctx.beginPath();
                ctx.arc(this.x + 7.5, this.y + 7.5, 4.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'Speed':
                // Speed power-up (lightning bolt)
                ctx.beginPath();
                ctx.moveTo(this.x + 7, this.y);
                ctx.lineTo(this.x + 3, this.y + 5);
                ctx.lineTo(this.x + 7, this.y + 5);
                ctx.lineTo(this.x + 3, this.y + 10);
                ctx.lineTo(this.x + 12, this.y + 5);
                ctx.lineTo(this.x + 8, this.y + 5);
                ctx.lineTo(this.x + 12, this.y);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new ShapeShifterDuel();
});