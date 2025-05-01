/**
 * UI components and rendering for the game.
 */
class GameUI {
    constructor() {
        // UI dimensions
        this.HEALTH_BAR_HEIGHT = 15;
        this.LEVEL_BAR_HEIGHT = 8;
    }
    
    /**
     * Draw the game background.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} width The width of the game area
     * @param {number} height The height of the game area
     */
    drawBackground(ctx, width, height) {
        ctx.fillStyle = GameColors.BACKGROUND;
        ctx.fillRect(0, 0, width, height);
        
        // Add grid lines for retro effect
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        
        for (let i = 0; i < height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
    }
    
    /**
     * Draw the player health bar.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} currentHealth Current health points
     * @param {number} maxHealth Maximum health points
     * @param {number} x X position of the bar
     * @param {number} y Y position of the bar
     * @param {number} width Width of the bar
     */
    drawHealthBar(ctx, currentHealth, maxHealth, x, y, width) {
        // Draw health background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, this.HEALTH_BAR_HEIGHT);
        
        // Calculate health width
        let healthWidth = Math.floor(width * Math.max(0, currentHealth / maxHealth));
        
        // Choose color based on health percentage
        let healthPercent = currentHealth / maxHealth;
        if (healthPercent > 0.6) {
            ctx.fillStyle = GameColors.SUCCESS_GREEN;
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = GameColors.ACCENT_YELLOW;
        } else {
            ctx.fillStyle = GameColors.HEALTH_RED;
        }
        
        // Draw health bar
        ctx.fillRect(x, y, healthWidth, this.HEALTH_BAR_HEIGHT);
        
        // Draw border
        ctx.strokeStyle = GameColors.TEXT;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, this.HEALTH_BAR_HEIGHT);
        
        // Draw health text
        ctx.fillStyle = GameColors.TEXT;
        ctx.font = '12px monospace';
        let healthText = currentHealth + '/' + maxHealth;
        let textWidth = ctx.measureText(healthText).width;
        ctx.fillText(healthText, x + (width - textWidth) / 2, y + 12);
    }
    
    /**
     * Draw the level progress bar.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {Level} level The current level
     * @param {number} x X position of the bar
     * @param {number} y Y position of the bar
     * @param {number} width Width of the bar
     */
    drawLevelProgressBar(ctx, level, x, y, width) {
        // Draw level progress background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, this.LEVEL_BAR_HEIGHT);
        
        // Calculate progress width
        let progressWidth = Math.floor(width * level.getProgressPercentage());
        
        // Draw progress bar
        ctx.fillStyle = GameColors.ACCENT_YELLOW;
        ctx.fillRect(x, y, progressWidth, this.LEVEL_BAR_HEIGHT);
        
        // Draw border
        ctx.strokeStyle = GameColors.TEXT;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, this.LEVEL_BAR_HEIGHT);
    }
    
    /**
     * Draw game stats.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {Level} level Current level
     * @param {number} score Current score
     * @param {number} lives Remaining lives
     * @param {string} playerShape Current player shape
     */
    drawGameStats(ctx, level, score, lives, playerShape) {
        ctx.fillStyle = GameColors.TEXT;
        ctx.font = 'bold 14px monospace';
        
        // Use consistent spacing for all items in the HUD
        let y = 25;
        let lineHeight = 22;
        
        // Level indicator
        ctx.fillText('LEVEL: ' + level.levelNumber, 10, y);
        y += lineHeight;
        
        // Score
        ctx.fillText('SCORE: ' + score, 10, y);
        y += lineHeight;
        
        // Lives with heart symbols
        ctx.fillText('LIVES: ', 10, y);
        for (let i = 0; i < lives; i++) {
            // Draw simple pixel heart
            ctx.fillStyle = GameColors.HEALTH_RED;
            ctx.fillRect(70 + i * 20, y - 10, 5, 5);
            ctx.fillRect(75 + i * 20, y - 10, 5, 5);
            ctx.fillRect(65 + i * 20, y - 5, 15, 5);
            ctx.fillRect(70 + i * 20, y, 5, 5);
            ctx.fillStyle = GameColors.TEXT;
        }
        y += lineHeight;
        
        // Current shape
        ctx.fillText('SHAPE: ' + playerShape, 10, y);
        y += lineHeight;
        
        // Controls reminder
        ctx.font = '12px monospace';
        ctx.fillText('1-2-3: Change Shape   |   ARROWS: Move   |   SPACE: Fire', 10, y + 15);
    }
    
    /**
     * Draw enemy health bar.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {object} enemyBounds The enemy bounds {x, y, width, height}
     * @param {number} health Current health
     * @param {number} maxHealth Maximum health
     * @param {boolean} matchingPlayerShape Whether the player shape matches the enemy
     */
    drawEnemyHealthBar(ctx, enemyBounds, health, maxHealth, matchingPlayerShape) {
        // Draw health background
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemyBounds.x, enemyBounds.y - 10, enemyBounds.width, 5);
        
        // Draw health bar
        ctx.fillStyle = GameColors.HEALTH_RED;
        let healthWidth = Math.floor(enemyBounds.width * (health / maxHealth));
        ctx.fillRect(enemyBounds.x, enemyBounds.y - 10, healthWidth, 5);
        
        // Highlight enemies matching player shape for critical hits
        if (matchingPlayerShape) {
            ctx.fillStyle = this.hexToRgba(GameColors.ACCENT_YELLOW, 0.4);
            ctx.beginPath();
            ctx.arc(
                enemyBounds.x + enemyBounds.width / 2,
                enemyBounds.y + enemyBounds.height / 2,
                enemyBounds.width / 2 + 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    /**
     * Draw game over screen.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} width The width of the game area
     * @param {number} height The height of the game area
     * @param {number} finalScore The final score
     * @param {number} highestLevel The highest level reached
     */
    drawGameOverScreen(ctx, width, height, finalScore, highestLevel) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = GameColors.HEALTH_RED;
        
        let gameOver = 'GAME OVER';
        let textWidth = ctx.measureText(gameOver).width;
        ctx.fillText(gameOver, (width - textWidth) / 2, height / 2 - 30);
        
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = GameColors.TEXT;
        
        let scoreText = 'FINAL SCORE: ' + finalScore;
        let levelText = 'HIGHEST LEVEL: ' + highestLevel;
        
        textWidth = ctx.measureText(scoreText).width;
        ctx.fillText(scoreText, (width - textWidth) / 2, height / 2 + 10);
        
        textWidth = ctx.measureText(levelText).width;
        ctx.fillText(levelText, (width - textWidth) / 2, height / 2 + 40);
        
        let restartText = 'PRESS ENTER TO RESTART';
        ctx.font = '12px monospace';
        ctx.fillStyle = GameColors.ACCENT_YELLOW;
        textWidth = ctx.measureText(restartText).width;
        ctx.fillText(restartText, (width - textWidth) / 2, height / 2 + 80);
    }
    
    /**
     * Draw the start screen.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} width The width of the game area
     * @param {number} height The height of the game area
     * @param {number} timestamp Current timestamp for animations
     */
    drawStartScreen(ctx, width, height, timestamp) {
        // Title
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = GameColors.ACCENT_YELLOW;
        let title = 'SHAPE SHIFTER DUEL';
        let textWidth = ctx.measureText(title).width;
        ctx.fillText(title, (width - textWidth) / 2, height / 3);
        
        // Subtitle
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = GameColors.TEXT;
        let subtitle = 'LEVEL-BASED ARCADE SHOOTER';
        textWidth = ctx.measureText(subtitle).width;
        ctx.fillText(subtitle, (width - textWidth) / 2, height / 3 + 40);
        
        // Instructions
        ctx.font = '12px monospace';
        let instructions = [
            'CONTROLS:',
            'ARROWS: Move',
            'SPACE: Fire',
            '1-2-3: Change Shape',
            'P: Pause Game'
        ];
        
        let y = height / 2;
        for (let instruction of instructions) {
            textWidth = ctx.measureText(instruction).width;
            ctx.fillText(instruction, (width - textWidth) / 2, y);
            y += 25;
        }
        
        // Start prompt - blinking effect
        if (Math.floor(timestamp / 500) % 2 === 0) {
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = GameColors.SUCCESS_GREEN;
            let startPrompt = 'PRESS ENTER TO START';
            textWidth = ctx.measureText(startPrompt).width;
            ctx.fillText(startPrompt, (width - textWidth) / 2, height * 3 / 4 + 40);
        }
    }
    
    /**
     * Convert hex color to rgba.
     * 
     * @param {string} hex The hex color
     * @param {number} alpha The alpha value
     * @return {string} The rgba color string
     */
    hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}