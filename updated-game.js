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
        this.singlePlayerMode.start(level);
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
        }
        
        this.gameMode = 'menu';
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
        
        // Update canvas dimensions to match container
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Draw background
        this.gameUI.drawBackground(this.ctx, this.width, this.height);
        
        // Handle different game modes
        if (this.gameMode === 'menu') {
            // In menu mode, just continue the loop
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        } else if (this.gameMode === 'single') {
            // Single player mode handled by its own game loop
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        } else if (this.gameMode === 'duel') {
            // Duel mode handled by its own game loop
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Continue the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Set up keyboard input for traditional level-based game mode.
     */
    setupKeyboardInput() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    /**
     * Handle keyboard input.
     */
    handleKeyDown(e) {
        // We only need to handle global escape key in this class
        // Individual game modes handle their own input
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.stopGame();
        }
    }
}