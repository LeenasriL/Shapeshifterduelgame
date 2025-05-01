import java.util.Random;

/**
 * Represents a game level with its specific properties.
 */
public class Level {
    private int levelNumber;
    private int playerMaxHealth;
    private int enemySpawnRate; // milliseconds between enemy spawns
    private float enemyHealthMultiplier;
    private float enemyDamageMultiplier;
    private float enemySpeedMultiplier;
    private int pointsToNextLevel;
    private int currentPoints;
    private Random random;
    
    /**
     * Constructor for a level.
     * 
     * @param levelNumber The level number
     */
    public Level(int levelNumber) {
        this.levelNumber = levelNumber;
        this.random = new Random();
        calculateLevelProperties();
        resetCurrentPoints();
    }
    
    /**
     * Calculate the properties of the level based on its number.
     */
    private void calculateLevelProperties() {
        // Base player health is 100, increases by 20 per level up to a max of 200
        this.playerMaxHealth = Math.min(100 + (levelNumber - 1) * 20, 200);
        
        // Enemies spawn more frequently in higher levels
        this.enemySpawnRate = Math.max(1500 - (levelNumber - 1) * 100, 300);
        
        // Enemy attributes scale with level
        this.enemyHealthMultiplier = 1.0f + (levelNumber - 1) * 0.2f;
        this.enemyDamageMultiplier = 1.0f + (levelNumber - 1) * 0.15f;
        this.enemySpeedMultiplier = 1.0f + (levelNumber - 1) * 0.1f;
        
        // Points needed to advance to the next level
        this.pointsToNextLevel = 500 + (levelNumber - 1) * 300;
    }
    
    /**
     * Reset the current points for this level.
     */
    public void resetCurrentPoints() {
        this.currentPoints = 0;
    }
    
    /**
     * Add points to the current level progress.
     * 
     * @param points The points to add
     * @return true if this level is completed, false otherwise
     */
    public boolean addPoints(int points) {
        this.currentPoints += points;
        return this.currentPoints >= this.pointsToNextLevel;
    }
    
    /**
     * Get a random enemy spawn position.
     * 
     * @param maxX The maximum X position
     * @return The X position for a new enemy
     */
    public int getRandomEnemyPosition(int maxX) {
        return random.nextInt(maxX);
    }
    
    /**
     * Get a random enemy type.
     * 
     * @return The type name: "Circle", "Triangle", or "Cube"
     */
    public String getRandomEnemyType() {
        String[] shapes = {"Circle", "Triangle", "Cube"};
        return shapes[random.nextInt(shapes.length)];
    }
    
    // Getters
    public int getLevelNumber() {
        return levelNumber;
    }
    
    public int getPlayerMaxHealth() {
        return playerMaxHealth;
    }
    
    public int getEnemySpawnRate() {
        return enemySpawnRate;
    }
    
    public float getEnemyHealthMultiplier() {
        return enemyHealthMultiplier;
    }
    
    public float getEnemyDamageMultiplier() {
        return enemyDamageMultiplier;
    }
    
    public float getEnemySpeedMultiplier() {
        return enemySpeedMultiplier;
    }
    
    public int getPointsToNextLevel() {
        return pointsToNextLevel;
    }
    
    public int getCurrentPoints() {
        return currentPoints;
    }
    
    /**
     * Get the progress percentage towards completing this level.
     * 
     * @return A value between 0.0 and 1.0
     */
    public float getProgressPercentage() {
        return (float) currentPoints / pointsToNextLevel;
    }
}
