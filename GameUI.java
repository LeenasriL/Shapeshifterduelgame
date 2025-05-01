import javax.swing.*;
import java.awt.*;

/**
 * UI components and rendering for the game.
 */
public class GameUI {
    private Font pixelFont;
    private Font smallPixelFont;
    
    // UI dimensions
    private final int HEALTH_BAR_HEIGHT = 15;
    private final int LEVEL_BAR_HEIGHT = 8;
    
    public GameUI() {
        // Try to load a pixel font, fallback to monospaced
        try {
            // Use Monospaced as our "pixel" font as it's available on all systems
            pixelFont = new Font("Monospaced", Font.BOLD, 14);
            smallPixelFont = new Font("Monospaced", Font.PLAIN, 12);
        } catch (Exception e) {
            // Fallback
            pixelFont = new Font("SansSerif", Font.BOLD, 14);
            smallPixelFont = new Font("SansSerif", Font.PLAIN, 12);
        }
    }
    
    /**
     * Draw the game background.
     * 
     * @param g The graphics context
     * @param width The width of the game area
     * @param height The height of the game area
     */
    public void drawBackground(Graphics g, int width, int height) {
        g.setColor(GameColors.BACKGROUND);
        g.fillRect(0, 0, width, height);
        
        // Add grid lines for retro effect
        g.setColor(new Color(0x222222));
        for (int i = 0; i < width; i += 20) {
            g.drawLine(i, 0, i, height);
        }
        for (int i = 0; i < height; i += 20) {
            g.drawLine(0, i, width, i);
        }
    }
    
    /**
     * Draw the player health bar.
     * 
     * @param g The graphics context
     * @param currentHealth Current health points
     * @param maxHealth Maximum health points
     * @param x X position of the bar
     * @param y Y position of the bar
     * @param width Width of the bar
     */
    public void drawHealthBar(Graphics g, int currentHealth, int maxHealth, int x, int y, int width) {
        // Draw health background
        g.setColor(new Color(0x333333));
        g.fillRect(x, y, width, HEALTH_BAR_HEIGHT);
        
        // Calculate health width
        int healthWidth = (int)(width * Math.max(0, (double)currentHealth / maxHealth));
        
        // Choose color based on health percentage
        double healthPercent = (double)currentHealth / maxHealth;
        if (healthPercent > 0.6) {
            g.setColor(GameColors.SUCCESS_GREEN);
        } else if (healthPercent > 0.3) {
            g.setColor(GameColors.ACCENT_YELLOW);
        } else {
            g.setColor(GameColors.HEALTH_RED);
        }
        
        // Draw health bar
        g.fillRect(x, y, healthWidth, HEALTH_BAR_HEIGHT);
        
        // Draw border
        g.setColor(GameColors.TEXT);
        g.drawRect(x, y, width, HEALTH_BAR_HEIGHT);
        
        // Draw health text
        g.setFont(smallPixelFont);
        String healthText = currentHealth + "/" + maxHealth;
        FontMetrics fm = g.getFontMetrics();
        int textX = x + (width - fm.stringWidth(healthText)) / 2;
        int textY = y + fm.getAscent() + (HEALTH_BAR_HEIGHT - fm.getHeight()) / 2;
        g.drawString(healthText, textX, textY);
    }
    
    /**
     * Draw the level progress bar.
     * 
     * @param g The graphics context
     * @param level The current level
     * @param x X position of the bar
     * @param y Y position of the bar
     * @param width Width of the bar
     */
    public void drawLevelProgressBar(Graphics g, Level level, int x, int y, int width) {
        // Draw level progress background
        g.setColor(new Color(0x333333));
        g.fillRect(x, y, width, LEVEL_BAR_HEIGHT);
        
        // Calculate progress width
        int progressWidth = (int)(width * level.getProgressPercentage());
        
        // Draw progress bar
        g.setColor(GameColors.ACCENT_YELLOW);
        g.fillRect(x, y, progressWidth, LEVEL_BAR_HEIGHT);
        
        // Draw border
        g.setColor(GameColors.TEXT);
        g.drawRect(x, y, width, LEVEL_BAR_HEIGHT);
    }
    
    /**
     * Draw game stats.
     * 
     * @param g The graphics context
     * @param level Current level
     * @param score Current score
     * @param lives Remaining lives
     * @param playerShape Current player shape
     */
    public void drawGameStats(Graphics g, Level level, int score, int lives, String playerShape) {
        g.setColor(GameColors.TEXT);
        g.setFont(pixelFont);
        
        // Use consistent spacing for all items in the HUD
        int y = 25;
        int lineHeight = 22;
        
        // Level indicator
        g.drawString("LEVEL: " + level.getLevelNumber(), 10, y);
        y += lineHeight;
        
        // Score
        g.drawString("SCORE: " + score, 10, y);
        y += lineHeight;
        
        // Lives with heart symbols
        g.drawString("LIVES: ", 10, y);
        for (int i = 0; i < lives; i++) {
            // Draw simple pixel heart
            g.setColor(GameColors.HEALTH_RED);
            g.fillRect(70 + i * 20, y - 10, 5, 5);
            g.fillRect(75 + i * 20, y - 10, 5, 5);
            g.fillRect(65 + i * 20, y - 5, 15, 5);
            g.fillRect(70 + i * 20, y, 5, 5);
            g.setColor(GameColors.TEXT);
        }
        y += lineHeight;
        
        // Current shape
        g.drawString("SHAPE: " + playerShape, 10, y);
        y += lineHeight;
        
        // Controls reminder
        g.setFont(smallPixelFont);
        g.drawString("1-2-3: Change Shape   |   ARROWS: Move   |   SPACE: Fire", 10, y + 15);
    }
    
    /**
     * Draw enemy health bar.
     * 
     * @param g The graphics context
     * @param enemy The enemy object
     * @param health Current health
     * @param maxHealth Maximum health
     * @param matchingPlayerShape Whether the player shape matches the enemy
     */
    public void drawEnemyHealthBar(Graphics g, Rectangle enemyBounds, int health, int maxHealth, boolean matchingPlayerShape) {
        // Draw health background
        g.setColor(new Color(0x333333));
        g.fillRect(enemyBounds.x, enemyBounds.y - 10, enemyBounds.width, 5);
        
        // Draw health bar
        g.setColor(GameColors.HEALTH_RED);
        int healthWidth = (int)(enemyBounds.width * ((double)health / maxHealth));
        g.fillRect(enemyBounds.x, enemyBounds.y - 10, healthWidth, 5);
        
        // Highlight enemies matching player shape for critical hits
        if (matchingPlayerShape) {
            g.setColor(new Color(GameColors.ACCENT_YELLOW.getRed(), 
                              GameColors.ACCENT_YELLOW.getGreen(), 
                              GameColors.ACCENT_YELLOW.getBlue(), 100));
            g.fillOval(enemyBounds.x - 5, enemyBounds.y - 5, 
                       enemyBounds.width + 10, enemyBounds.height + 10);
        }
    }
    
    /**
     * Draw game over screen.
     * 
     * @param g The graphics context
     * @param width The width of the game area
     * @param height The height of the game area
     * @param finalScore The final score
     * @param highestLevel The highest level reached
     */
    public void drawGameOverScreen(Graphics g, int width, int height, int finalScore, int highestLevel) {
        // Semi-transparent overlay
        g.setColor(new Color(0, 0, 0, 200));
        g.fillRect(0, 0, width, height);
        
        g.setFont(new Font("Monospaced", Font.BOLD, 30));
        g.setColor(GameColors.HEALTH_RED);
        
        String gameOver = "GAME OVER";
        FontMetrics fmBig = g.getFontMetrics();
        int textX = (width - fmBig.stringWidth(gameOver)) / 2;
        g.drawString(gameOver, textX, height / 2 - 30);
        
        g.setFont(pixelFont);
        g.setColor(GameColors.TEXT);
        
        String scoreText = "FINAL SCORE: " + finalScore;
        String levelText = "HIGHEST LEVEL: " + highestLevel;
        
        FontMetrics fm = g.getFontMetrics();
        
        g.drawString(scoreText, (width - fm.stringWidth(scoreText)) / 2, height / 2 + 10);
        g.drawString(levelText, (width - fm.stringWidth(levelText)) / 2, height / 2 + 40);
        
        String restartText = "PRESS ENTER TO RESTART";
        g.setFont(smallPixelFont);
        g.setColor(GameColors.ACCENT_YELLOW);
        g.drawString(restartText, 
                  (width - g.getFontMetrics().stringWidth(restartText)) / 2, 
                  height / 2 + 80);
    }
    
    /**
     * Get the pixel font.
     * 
     * @return The pixel font
     */
    public Font getPixelFont() {
        return pixelFont;
    }
    
    /**
     * Get the small pixel font.
     * 
     * @return The small pixel font
     */
    public Font getSmallPixelFont() {
        return smallPixelFont;
    }
}
