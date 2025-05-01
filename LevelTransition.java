import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

/**
 * Handles level transitions in the game.
 */
public class LevelTransition {
    private boolean isTransitioning = false;
    private Level currentLevel;
    private Level nextLevel;
    private float transitionAlpha = 0.0f;
    private Timer transitionTimer;
    private static final float TRANSITION_STEP = 0.05f;
    private boolean fadeIn = false;
    
    /**
     * Constructor for the level transition.
     */
    public LevelTransition() {
        this.transitionTimer = null;
    }
    
    /**
     * Start a level transition.
     * 
     * @param currentLevel The level transitioning from
     * @param nextLevel The level transitioning to
     * @param finishedCallback The callback to run when the transition is complete
     */
    public void startTransition(Level currentLevel, Level nextLevel, Runnable finishedCallback) {
        this.currentLevel = currentLevel;
        this.nextLevel = nextLevel;
        this.isTransitioning = true;
        this.transitionAlpha = 0.0f;
        this.fadeIn = false;
        
        if (transitionTimer != null && transitionTimer.isRunning()) {
            transitionTimer.stop();
        }
        
        ActionListener transitionAction = e -> {
            if (!fadeIn) {
                // Fading out
                transitionAlpha += TRANSITION_STEP;
                if (transitionAlpha >= 1.0f) {
                    transitionAlpha = 1.0f;
                    fadeIn = true;
                }
            } else {
                // Fading in
                transitionAlpha -= TRANSITION_STEP;
                if (transitionAlpha <= 0.0f) {
                    transitionAlpha = 0.0f;
                    isTransitioning = false;
                    ((Timer)e.getSource()).stop();
                    finishedCallback.run();
                }
            }
        };
        
        transitionTimer = new Timer(50, transitionAction);
        transitionTimer.start();
    }
    
    /**
     * Draw the transition effect.
     * 
     * @param g The graphics context
     * @param width The width of the game area
     * @param height The height of the game area
     */
    public void draw(Graphics g, int width, int height) {
        if (!isTransitioning) return;
        
        if (fadeIn) {
            // When fading in, draw the next level text
            drawLevelText(g, width, height, nextLevel);
        } else {
            // When fading out, draw the current level text
            drawLevelText(g, width, height, currentLevel);
        }
        
        // Draw overlay with current alpha
        g.setColor(new Color(0, 0, 0, (int)(transitionAlpha * 255)));
        g.fillRect(0, 0, width, height);
    }
    
    private void drawLevelText(Graphics g, int width, int height, Level level) {
        g.setColor(new Color(
            GameColors.ACCENT_YELLOW.getRed(),
            GameColors.ACCENT_YELLOW.getGreen(),
            GameColors.ACCENT_YELLOW.getBlue(),
            (int)((1.0f - Math.abs(transitionAlpha - 0.5f) * 2) * 255)
        ));
        
        Font titleFont = new Font("Monospaced", Font.BOLD, 36);
        g.setFont(titleFont);
        
        String levelText = "LEVEL " + level.getLevelNumber();
        FontMetrics fm = g.getFontMetrics();
        
        int textX = (width - fm.stringWidth(levelText)) / 2;
        int textY = height / 2 - 20;
        
        g.drawString(levelText, textX, textY);
        
        // Draw level description
        Font descFont = new Font("Monospaced", Font.PLAIN, 16);
        g.setFont(descFont);
        
        String[] descriptions = {
            "MAX HEALTH: " + level.getPlayerMaxHealth(),
            "ENEMY HEALTH: +" + (int)((level.getEnemyHealthMultiplier() - 1.0f) * 100) + "%",
            "ENEMY DAMAGE: +" + (int)((level.getEnemyDamageMultiplier() - 1.0f) * 100) + "%"
        };
        
        fm = g.getFontMetrics();
        textY += 40;
        
        for (String desc : descriptions) {
            textX = (width - fm.stringWidth(desc)) / 2;
            g.drawString(desc, textX, textY);
            textY += 30;
        }
        
        String readyText = "GET READY!";
        textX = (width - fm.stringWidth(readyText)) / 2;
        textY += 20;
        g.drawString(readyText, textX, textY);
    }
    
    /**
     * Check if a transition is in progress.
     * 
     * @return true if transitioning, false otherwise
     */
    public boolean isTransitioning() {
        return isTransitioning;
    }
    
    /**
     * Stop the current transition.
     */
    public void stopTransition() {
        if (transitionTimer != null && transitionTimer.isRunning()) {
            transitionTimer.stop();
        }
        isTransitioning = false;
    }
}
