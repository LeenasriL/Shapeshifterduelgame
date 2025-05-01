/**
 * Represents a game level with its specific properties.
 */
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.currentPoints = 0;
        this.calculateLevelProperties();
    }
    
    /**
     * Calculate the properties of the level based on its number.
     */
    calculateLevelProperties() {
        // Base player health is 100, increases by 20 per level up to a max of 200
        this.playerMaxHealth = Math.min(100 + (this.levelNumber - 1) * 20, 200);
        
        // Enemies spawn more frequently in higher levels
        this.enemySpawnRate = Math.max(1500 - (this.levelNumber - 1) * 100, 300);
        
        // Enemy attributes scale with level
        this.enemyHealthMultiplier = 1.0 + (this.levelNumber - 1) * 0.2;
        this.enemyDamageMultiplier = 1.0 + (this.levelNumber - 1) * 0.15;
        this.enemySpeedMultiplier = 1.0 + (this.levelNumber - 1) * 0.1;
        
        // Points needed to advance to the next level
        this.pointsToNextLevel = 500 + (this.levelNumber - 1) * 300;
    }
    
    /**
     * Reset the current points for this level.
     */
    resetCurrentPoints() {
        this.currentPoints = 0;
    }
    
    /**
     * Add points to the current level progress.
     * 
     * @param {number} points The points to add
     * @return {boolean} true if this level is completed, false otherwise
     */
    addPoints(points) {
        this.currentPoints += points;
        return this.currentPoints >= this.pointsToNextLevel;
    }
    
    /**
     * Get a random enemy spawn position.
     * 
     * @param {number} maxX The maximum X position
     * @return {number} The X position for a new enemy
     */
    getRandomEnemyPosition(maxX) {
        return Math.floor(Math.random() * maxX);
    }
    
    /**
     * Get a random enemy type.
     * 
     * @return {string} The type name: "Circle", "Triangle", or "Cube"
     */
    getRandomEnemyType() {
        const shapes = ["Circle", "Triangle", "Cube"];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
    
    /**
     * Get the progress percentage towards completing this level.
     * 
     * @return {number} A value between 0.0 and 1.0
     */
    getProgressPercentage() {
        return this.currentPoints / this.pointsToNextLevel;
    }
}