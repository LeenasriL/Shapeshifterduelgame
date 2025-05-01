/**
 * Handles level transitions in the game.
 */
class LevelTransition {
    constructor() {
        this.isTransitioning = false;
        this.currentLevel = null;
        this.nextLevel = null;
        this.transitionAlpha = 0.0;
        this.fadeIn = false;
        this.transitionStep = 0.05;
        this.finishedCallback = null;
        this.lastTransitionTime = 0;
    }
    
    /**
     * Start a level transition.
     * 
     * @param {Level} currentLevel The level transitioning from
     * @param {Level} nextLevel The level transitioning to
     * @param {Function} finishedCallback The callback to run when the transition is complete
     */
    startTransition(currentLevel, nextLevel, finishedCallback) {
        this.currentLevel = currentLevel;
        this.nextLevel = nextLevel;
        this.isTransitioning = true;
        this.transitionAlpha = 0.0;
        this.fadeIn = false;
        this.finishedCallback = finishedCallback;
        this.lastTransitionTime = 0;
    }
    
    /**
     * Update the transition effect.
     * 
     * @param {number} timestamp Current timestamp for animations
     */
    update(timestamp) {
        if (!this.isTransitioning) return;
        
        // Update every 50ms (similar to the Java Timer's delay)
        if (timestamp - this.lastTransitionTime < 50) return;
        this.lastTransitionTime = timestamp;
        
        if (!this.fadeIn) {
            // Fading out
            this.transitionAlpha += this.transitionStep;
            if (this.transitionAlpha >= 1.0) {
                this.transitionAlpha = 1.0;
                this.fadeIn = true;
            }
        } else {
            // Fading in
            this.transitionAlpha -= this.transitionStep;
            if (this.transitionAlpha <= 0.0) {
                this.transitionAlpha = 0.0;
                this.isTransitioning = false;
                if (this.finishedCallback) {
                    this.finishedCallback();
                }
            }
        }
    }
    
    /**
     * Draw the transition effect.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} width The width of the game area
     * @param {number} height The height of the game area
     */
    draw(ctx, width, height) {
        if (!this.isTransitioning) return;
        
        if (this.fadeIn) {
            // When fading in, draw the next level text
            this.drawLevelText(ctx, width, height, this.nextLevel);
        } else {
            // When fading out, draw the current level text
            this.drawLevelText(ctx, width, height, this.currentLevel);
        }
        
        // Draw overlay with current alpha
        ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * Draw the level text.
     * 
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {number} width The width of the game area
     * @param {number} height The height of the game area
     * @param {Level} level The level to display
     */
    drawLevelText(ctx, width, height, level) {
        // Calculate text opacity based on transition progress
        let textAlpha = 1.0 - Math.abs(this.transitionAlpha - 0.5) * 2;
        ctx.fillStyle = this.hexToRgba(GameColors.ACCENT_YELLOW, textAlpha);
        
        ctx.font = 'bold 36px monospace';
        let levelText = 'LEVEL ' + level.levelNumber;
        let textWidth = ctx.measureText(levelText).width;
        ctx.fillText(levelText, (width - textWidth) / 2, height / 2 - 20);
        
        // Draw level description
        ctx.font = '16px monospace';
        
        let descriptions = [
            'MAX HEALTH: ' + level.playerMaxHealth,
            'ENEMY HEALTH: +' + Math.floor((level.enemyHealthMultiplier - 1.0) * 100) + '%',
            'ENEMY DAMAGE: +' + Math.floor((level.enemyDamageMultiplier - 1.0) * 100) + '%'
        ];
        
        let y = height / 2 + 20;
        for (let desc of descriptions) {
            textWidth = ctx.measureText(desc).width;
            ctx.fillText(desc, (width - textWidth) / 2, y);
            y += 30;
        }
        
        let readyText = 'GET READY!';
        textWidth = ctx.measureText(readyText).width;
        ctx.fillText(readyText, (width - textWidth) / 2, y + 20);
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
    
    /**
     * Stop the current transition.
     */
    stopTransition() {
        this.isTransitioning = false;
    }
}