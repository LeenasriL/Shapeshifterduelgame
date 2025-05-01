import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;

/**
 * ShapeShifterDuel - a level-based game extending ShapeShiftingGame
 * with varying health points for different difficulty levels and retro-style UI.
 */
public class ShapeShifterDuel extends JPanel implements ActionListener, KeyListener {
    // Game objects
    private Shape player;
    private ArrayList<Enemy> enemies;
    private ArrayList<Projectile> projectiles;
    private ArrayList<PowerUp> powerUps;
    private javax.swing.Timer gameTimer;
    private javax.swing.Timer enemySpawnTimer;
    
    // Game state
    private int playerHealth;
    private int playerLives = 3;
    private int score = 0;
    private boolean isGameOver = false;
    private boolean isGamePaused = false;
    private boolean isInvulnerable = false;
    private boolean isGameStarted = false;
    private int playerSpeed = 8;
    private int starCount = 100;
    private int bonusStars = 0;
    private int drainRate = 2;
    private int durability = 100;
    
    // Level management
    private Level currentLevel;
    private int highestLevelReached = 1;
    private LevelTransition levelTransition;
    
    // Timing variables
    private long lastShotTime = 0;
    private final long SHOT_DELAY = 200;
    private long invulnerableEndTime = 0;
    private final long INVULNERABLE_DURATION = 1500;
    private Random random = new Random();
    
    // UI
    private GameUI gameUI;
    private final int GAME_WIDTH = 500;
    private final int GAME_HEIGHT = 500;
    
    /**
     * Constructor for the ShapeShifterDuel game.
     */
    public ShapeShifterDuel() {
        // Initialize game objects
        player = new Circle(250, 400);
        enemies = new ArrayList<>();
        projectiles = new ArrayList<>();
        powerUps = new ArrayList<>();
        
        // Initialize UI
        gameUI = new GameUI();
        
        // Initialize level system
        currentLevel = new Level(1);
        levelTransition = new LevelTransition();
        playerHealth = currentLevel.getPlayerMaxHealth();
        
        // Set up game timers
        gameTimer = new javax.swing.Timer(16, this);
        
        // Set up focus handling for keyboard input
        setFocusable(true);
        addKeyListener(this);
        
        // Set background color
        setBackground(GameColors.BACKGROUND);
        
        // Initial screen - game will start on key press
        showStartScreen();
    }
    
    /**
     * Show the start screen.
     */
    private void showStartScreen() {
        isGameStarted = false;
    }
    
    /**
     * Start the game.
     */
    private void startGame() {
        isGameStarted = true;
        isGameOver = false;
        
        // Reset game state
        playerLives = 3;
        score = 0;
        currentLevel = new Level(1);
        highestLevelReached = 1;
        playerHealth = currentLevel.getPlayerMaxHealth();
        
        // Clear game objects
        enemies.clear();
        projectiles.clear();
        powerUps.clear();
        
        // Reset player position
        player = new Circle(250, 400);
        
        // Start timers
        gameTimer.start();
        startEnemySpawner();
    }
    
    /**
     * Start the enemy spawner with the current level's spawn rate.
     */
    private void startEnemySpawner() {
        if (enemySpawnTimer != null && enemySpawnTimer.isRunning()) {
            enemySpawnTimer.stop();
        }
        
        enemySpawnTimer = new javax.swing.Timer(currentLevel.getEnemySpawnRate(), e -> spawnEnemy());
        enemySpawnTimer.start();
    }
    
    /**
     * Advance to the next level.
     */
    private void advanceToNextLevel() {
        int nextLevelNumber = currentLevel.getLevelNumber() + 1;
        
        // Update highest level reached
        if (nextLevelNumber > highestLevelReached) {
            highestLevelReached = nextLevelNumber;
        }
        
        // Create the next level
        Level nextLevel = new Level(nextLevelNumber);
        
        // Transition to the next level
        levelTransition.startTransition(currentLevel, nextLevel, () -> {
            // After transition is complete
            currentLevel = nextLevel;
            playerHealth = currentLevel.getPlayerMaxHealth();
            
            // Update enemy spawner with new level's spawn rate
            startEnemySpawner();
            
            // Clear all enemies and reset player position
            enemies.clear();
            player.x = 250;
            player.y = 400;
        });
    }
    
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        // Draw background
        gameUI.drawBackground(g, getWidth(), getHeight());
        
        if (!isGameStarted) {
            drawStartScreen(g);
            return;
        }
        
        if (isGameOver) {
            gameUI.drawGameOverScreen(g, getWidth(), getHeight(), score, highestLevelReached);
            return;
        }
        
        // Draw game objects
        player.draw(g);
        
        for (Enemy enemy : enemies) {
            enemy.draw(g);
            gameUI.drawEnemyHealthBar(g, 
                new Rectangle(enemy.x, enemy.y, enemy.width, enemy.height),
                enemy.health, 
                enemy.maxHealth, 
                player.shapeType.equals(enemy.shapeType));
        }
        
        for (Projectile projectile : projectiles) {
            projectile.draw(g);
        }
        
        for (PowerUp powerUp : powerUps) {
            powerUp.draw(g);
        }
        
        // Draw UI elements
        gameUI.drawHealthBar(g, playerHealth, currentLevel.getPlayerMaxHealth(), 10, getHeight() - 80, 200);
        gameUI.drawLevelProgressBar(g, currentLevel, 10, getHeight() - 60, 200);
        gameUI.drawGameStats(g, currentLevel, score, playerLives, player.shapeType);
        
        // Draw invulnerability effect
        if (isInvulnerable && System.currentTimeMillis() % 200 < 100) {
            g.setColor(new Color(255, 255, 255, 100));
            g.fillRect(player.x, player.y, player.width, player.height);
        }
        
        // Draw level transition if active
        if (levelTransition.isTransitioning()) {
            levelTransition.draw(g, getWidth(), getHeight());
        }
        
        // Draw pause overlay if paused
        if (isGamePaused) {
            g.setColor(new Color(0, 0, 0, 150));
            g.fillRect(0, 0, getWidth(), getHeight());
            
            g.setFont(gameUI.getPixelFont());
            g.setColor(GameColors.TEXT);
            String pausedText = "GAME PAUSED";
            FontMetrics fm = g.getFontMetrics();
            g.drawString(pausedText, (getWidth() - fm.stringWidth(pausedText)) / 2, getHeight() / 2);
            
            g.setFont(gameUI.getSmallPixelFont());
            String resumeText = "PRESS P TO RESUME";
            fm = g.getFontMetrics();
            g.drawString(resumeText, (getWidth() - fm.stringWidth(resumeText)) / 2, getHeight() / 2 + 30);
        }
    }
    
    /**
     * Draw the start screen.
     * 
     * @param g The graphics context
     */
    private void drawStartScreen(Graphics g) {
        // Title
        g.setFont(new Font("Monospaced", Font.BOLD, 36));
        g.setColor(GameColors.ACCENT_YELLOW);
        String title = "SHAPE SHIFTER DUEL";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, (getWidth() - fm.stringWidth(title)) / 2, getHeight() / 3);
        
        // Subtitle
        g.setFont(gameUI.getPixelFont());
        g.setColor(GameColors.TEXT);
        String subtitle = "LEVEL-BASED ARCADE SHOOTER";
        fm = g.getFontMetrics();
        g.drawString(subtitle, (getWidth() - fm.stringWidth(subtitle)) / 2, getHeight() / 3 + 40);
        
        // Instructions
        g.setFont(gameUI.getSmallPixelFont());
        String[] instructions = {
            "CONTROLS:",
            "ARROWS: Move",
            "SPACE: Fire",
            "1-2-3: Change Shape",
            "P: Pause Game"
        };
        
        int y = getHeight() / 2;
        for (String instruction : instructions) {
            fm = g.getFontMetrics();
            g.drawString(instruction, (getWidth() - fm.stringWidth(instruction)) / 2, y);
            y += 25;
        }
        
        // Start prompt
        g.setFont(gameUI.getPixelFont());
        g.setColor(GameColors.SUCCESS_GREEN);
        String startPrompt = "PRESS ENTER TO START";
        fm = g.getFontMetrics();
        
        // Make the text blink
        if (System.currentTimeMillis() % 1000 < 500) {
            g.drawString(startPrompt, (getWidth() - fm.stringWidth(startPrompt)) / 2, getHeight() * 3 / 4 + 40);
        }
    }
    
    @Override
    public void actionPerformed(ActionEvent e) {
        if (!isGameStarted || isGameOver || isGamePaused || levelTransition.isTransitioning()) {
            return;
        }
        
        // Update game objects
        for (Enemy enemy : enemies) {
            enemy.move();
        }
        
        Iterator<Projectile> projectileIterator = projectiles.iterator();
        while (projectileIterator.hasNext()) {
            Projectile projectile = projectileIterator.next();
            projectile.move();
            if (projectile.y < 0 || projectile.y > GAME_HEIGHT) {
                projectileIterator.remove();
            }
        }
        
        Iterator<PowerUp> powerUpIterator = powerUps.iterator();
        while (powerUpIterator.hasNext()) {
            PowerUp powerUp = powerUpIterator.next();
            powerUp.move();
            if (powerUp.y > GAME_HEIGHT) {
                powerUpIterator.remove();
            }
        }
        
        // Check for collisions
        checkCollisions();
        
        // Check invulnerability timer
        if (isInvulnerable && System.currentTimeMillis() > invulnerableEndTime) {
            isInvulnerable = false;
        }
        
        repaint();
    }
    
    /**
     * Spawn a new enemy based on the current level.
     */
    private void spawnEnemy() {
        if (!isGameStarted || isGameOver || isGamePaused || levelTransition.isTransitioning()) {
            return;
        }
        
        String shapeType = currentLevel.getRandomEnemyType();
        int xPos = currentLevel.getRandomEnemyPosition(GAME_WIDTH - 50);
        
        // Apply level multipliers for health and damage
        float healthMultiplier = currentLevel.getEnemyHealthMultiplier();
        float damageMultiplier = currentLevel.getEnemyDamageMultiplier();
        float speedMultiplier = currentLevel.getEnemySpeedMultiplier();
        
        Enemy enemy = null;
        switch(shapeType) {
            case "Circle":
                enemy = new EnemyCircle(xPos, 0);
                break;
            case "Triangle":
                enemy = new EnemyTriangle(xPos, 0);
                break;
            case "Cube":
                enemy = new EnemyCube(xPos, 0);
                break;
        }
        
        if (enemy != null) {
            // Apply level modifiers
            // Scale health based on level multiplier (maxHealth is final so we can't change it)
            int scaledMaxHealth = (int)(enemy.maxHealth * healthMultiplier);
            enemy.health = scaledMaxHealth;  // Set current health to the scaled max health
            enemy.damage = (int)(enemy.damage * damageMultiplier);
            enemy.speed = enemy.speed * speedMultiplier;
            
            enemies.add(enemy);
        }
        
        // Occasionally spawn a power-up (10% chance)
        if (random.nextInt(100) < 10) {
            spawnPowerUp();
        }
    }
    
    /**
     * Spawn a power-up at a random position.
     */
    private void spawnPowerUp() {
        int xPos = random.nextInt(GAME_WIDTH - 30);
        String[] types = {"Health", "Shield", "Speed"};
        String type = types[random.nextInt(types.length)];
        
        powerUps.add(new PowerUp(xPos, 0, type));
    }
    
    /**
     * Check collisions between game objects.
     */
    private void checkCollisions() {
        // Check player-enemy collisions
        Iterator<Enemy> enemyIterator = enemies.iterator();
        while (enemyIterator.hasNext()) {
            Enemy enemy = enemyIterator.next();
            
            // Player-enemy collision
            if (player.collidesWith(enemy) && !isInvulnerable) {
                takeDamage(enemy.damage);
            }
            
            // Enemy reached bottom of screen
            if (enemy.y > GAME_HEIGHT) {
                enemyIterator.remove();
            }
        }
        
        // Check projectile-enemy collisions
        Iterator<Projectile> projectileIterator = projectiles.iterator();
        while (projectileIterator.hasNext()) {
            Projectile projectile = projectileIterator.next();
            enemyIterator = enemies.iterator();
            boolean projectileRemoved = false;
            
            while (enemyIterator.hasNext() && !projectileRemoved) {
                Enemy enemy = enemyIterator.next();
                if (projectile.collidesWith(enemy)) {
                    boolean isCritical = projectile.shapeType.equals(enemy.shapeType);
                    int damage = isCritical ? enemy.maxHealth : projectile.damage;
                    
                    enemy.health -= damage;
                    projectileIterator.remove();
                    projectileRemoved = true;
                    
                    if (enemy.health <= 0) {
                        int pointsEarned = isCritical ? 20 * enemy.difficulty : 10 * enemy.difficulty;
                        score += pointsEarned;
                        
                        // Check for level completion
                        if (currentLevel.addPoints(pointsEarned)) {
                            advanceToNextLevel();
                        }
                        
                        enemyIterator.remove();
                        
                        // 20% chance to drop a power-up on enemy death
                        if (random.nextInt(100) < 20) {
                            powerUps.add(new PowerUp(enemy.x, enemy.y, "Health"));
                        }
                    }
                }
            }
        }
        
        // Check player-powerup collisions
        Iterator<PowerUp> powerUpIterator = powerUps.iterator();
        while (powerUpIterator.hasNext()) {
            PowerUp powerUp = powerUpIterator.next();
            if (player.collidesWith(powerUp)) {
                applyPowerUp(powerUp);
                powerUpIterator.remove();
            }
        }
    }
    
    /**
     * Apply the effect of a power-up.
     * 
     * @param powerUp The power-up to apply
     */
    private void applyPowerUp(PowerUp powerUp) {
        switch (powerUp.type) {
            case "Health":
                playerHealth = Math.min(playerHealth + 25, currentLevel.getPlayerMaxHealth());
                break;
            case "Shield":
                isInvulnerable = true;
                invulnerableEndTime = System.currentTimeMillis() + 5000; // 5 seconds of invulnerability
                break;
            case "Speed":
                playerSpeed += 2; // Speed boost
                // Schedule a timer to reset the speed after 10 seconds
                new javax.swing.Timer(10000, e -> playerSpeed = Math.max(8, playerSpeed - 2)).start();
                break;
        }
    }
    
    /**
     * Handle player taking damage.
     * 
     * @param amount The amount of damage to take
     */
    private void takeDamage(int amount) {
        playerHealth -= amount;
        isInvulnerable = true;
        invulnerableEndTime = System.currentTimeMillis() + INVULNERABLE_DURATION;
        
        if (playerHealth <= 0) {
            playerLives--;
            playerHealth = currentLevel.getPlayerMaxHealth();
            if (playerLives <= 0) {
                gameOver();
            }
        }
    }
    
    /**
     * End the game.
     */
    private void gameOver() {
        isGameOver = true;
        gameTimer.stop();
        if (enemySpawnTimer != null) {
            enemySpawnTimer.stop();
        }
    }
    
    /**
     * Toggle the game pause state.
     */
    private void togglePause() {
        isGamePaused = !isGamePaused;
        if (isGamePaused) {
            gameTimer.stop();
            if (enemySpawnTimer != null) {
                enemySpawnTimer.stop();
            }
        } else {
            gameTimer.start();
            if (enemySpawnTimer != null) {
                enemySpawnTimer.start();
            }
        }
    }
    
    @Override
    public void keyPressed(KeyEvent e) {
        int key = e.getKeyCode();
        
        // Start game on Enter key if not started
        if (!isGameStarted && key == KeyEvent.VK_ENTER) {
            startGame();
            return;
        }
        
        // Restart game on Enter key if game over
        if (isGameOver && key == KeyEvent.VK_ENTER) {
            startGame();
            return;
        }
        
        // Pause/unpause on P key
        if (key == KeyEvent.VK_P && isGameStarted && !isGameOver) {
            togglePause();
            return;
        }
        
        // Don't process other keys if game is paused, not started, or over
        if (isGamePaused || !isGameStarted || isGameOver || levelTransition.isTransitioning()) {
            return;
        }
        
        // Movement
        if (key == KeyEvent.VK_LEFT && player.x > 0) player.x -= playerSpeed;
        if (key == KeyEvent.VK_RIGHT && player.x < GAME_WIDTH - player.width) player.x += playerSpeed;
        if (key == KeyEvent.VK_UP && player.y > 0) player.y -= playerSpeed;
        if (key == KeyEvent.VK_DOWN && player.y < GAME_HEIGHT - player.height) player.y += playerSpeed;
        
        // Shooting
        if (key == KeyEvent.VK_SPACE) {
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastShotTime > SHOT_DELAY) {
                String shapeType = player.shapeType;
                
                // Fire a spread of bullets based on current level
                int centerX = player.x + player.width/2 - 2;
                
                // Base projectile pattern
                projectiles.add(new Projectile(centerX, player.y, 0, -20, shapeType, 5));
                
                // Add more projectiles for higher levels
                if (currentLevel.getLevelNumber() >= 2) {
                    projectiles.add(new Projectile(centerX - 8, player.y, 0, -20, shapeType, 5));
                    projectiles.add(new Projectile(centerX + 8, player.y, 0, -20, shapeType, 5));
                }
                
                if (currentLevel.getLevelNumber() >= 3) {
                    projectiles.add(new Projectile(centerX - 4, player.y - 5, 0, -20, shapeType, 5));
                    projectiles.add(new Projectile(centerX + 4, player.y - 5, 0, -20, shapeType, 5));
                }
                
                if (currentLevel.getLevelNumber() >= 5) {
                    projectiles.add(new Projectile(centerX - 12, player.y, -1, -19, shapeType, 5));
                    projectiles.add(new Projectile(centerX + 12, player.y, 1, -19, shapeType, 5));
                }
                
                lastShotTime = currentTime;
            }
        }
        
        // Shape shifting
        if (key == KeyEvent.VK_1) player = new Circle(player.x, player.y);
        if (key == KeyEvent.VK_2) player = new Triangle(player.x, player.y);
        if (key == KeyEvent.VK_3) player = new Cube(player.x, player.y);
    }
    
    @Override 
    public void keyReleased(KeyEvent e) {}
    
    @Override 
    public void keyTyped(KeyEvent e) {}
    
    /**
     * Base class for all shapes in the game.
     */
    abstract class Shape {
        protected int x, y;
        protected int width = 30, height = 30;
        protected Color color;
        protected String shapeType;
        
        public Shape(int x, int y, Color color, String shapeType) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.shapeType = shapeType;
        }
        
        public abstract void draw(Graphics g);
        
        public boolean collidesWith(Shape other) {
            return x < other.x + other.width && 
                   x + width > other.x && 
                   y < other.y + other.height && 
                   y + height > other.y;
        }
    }
    
    /**
     * Circle shape.
     */
    class Circle extends Shape {
        public Circle(int x, int y) {
            super(x, y, GameColors.PLAYER_CIRCLE, "Circle");
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            g.fillOval(x, y, width, height);
        }
    }
    
    /**
     * Triangle shape.
     */
    class Triangle extends Shape {
        public Triangle(int x, int y) {
            super(x, y, GameColors.PLAYER_TRIANGLE, "Triangle");
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            int[] xPoints = {x + width/2, x, x + width};
            int[] yPoints = {y, y + height, y + height};
            g.fillPolygon(xPoints, yPoints, 3);
        }
    }
    
    /**
     * Cube shape.
     */
    class Cube extends Shape {
        public Cube(int x, int y) {
            super(x, y, GameColors.PLAYER_CUBE, "Cube");
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            g.fillRect(x, y, width, height);
        }
    }
    
    /**
     * Base class for enemy shapes.
     */
    abstract class Enemy extends Shape {
        protected int health;
        protected final int maxHealth;
        protected int damage;
        protected final int difficulty;
        protected float speed = 2.0f;
        protected float x_float, y_float;
        
        public Enemy(int x, int y, Color color, String shapeType, int maxHealth, int damage, int difficulty) {
            super(x, y, color, shapeType);
            this.health = maxHealth;
            this.maxHealth = maxHealth;
            this.damage = damage;
            this.difficulty = difficulty;
            this.x_float = x;
            this.y_float = y;
        }
        
        public void move() {
            y_float += speed;
            y = (int)y_float;
        }
    }
    
    /**
     * Circle enemy.
     */
    class EnemyCircle extends Enemy {
        public EnemyCircle(int x, int y) {
            super(x, y, GameColors.ENEMY_CIRCLE, "Circle", 30, 5, 1);
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            g.fillOval(x, y, width, height);
        }
    }
    
    /**
     * Triangle enemy.
     */
    class EnemyTriangle extends Enemy {
        public EnemyTriangle(int x, int y) {
            super(x, y, GameColors.ENEMY_TRIANGLE, "Triangle", 40, 8, 2);
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            int[] xPoints = {x + width/2, x, x + width};
            int[] yPoints = {y, y + height, y + height};
            g.fillPolygon(xPoints, yPoints, 3);
        }
    }
    
    /**
     * Cube enemy.
     */
    class EnemyCube extends Enemy {
        public EnemyCube(int x, int y) {
            super(x, y, GameColors.ENEMY_CUBE, "Cube", 50, 10, 3);
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            g.fillRect(x, y, width, height);
        }
    }
    
    /**
     * Projectile fired by the player.
     */
    class Projectile {
        public int x, y;
        public int dx, dy;
        public String shapeType;
        public int damage;
        
        public Projectile(int x, int y, int dx, int dy, String shapeType, int damage) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.shapeType = shapeType;
            this.damage = damage;
        }
        
        public void move() {
            x += dx;
            y += dy;
        }
        
        public void draw(Graphics g) {
            // Color based on shape type
            switch (shapeType) {
                case "Circle":
                    g.setColor(GameColors.PLAYER_CIRCLE);
                    break;
                case "Triangle":
                    g.setColor(GameColors.PLAYER_TRIANGLE);
                    break;
                case "Cube":
                    g.setColor(GameColors.PLAYER_CUBE);
                    break;
                default:
                    g.setColor(Color.WHITE);
            }
            
            g.fillOval(x, y, 5, 5);
        }
        
        public boolean collidesWith(Shape other) {
            return x >= other.x && x <= other.x + other.width &&
                   y >= other.y && y <= other.y + other.height;
        }
    }
    
    /**
     * Power-up item that can be collected by the player.
     */
    class PowerUp extends Shape {
        private String type;
        private float ySpeed = 1.5f;
        private float yFloat;
        
        public PowerUp(int x, int y, String type) {
            super(x, y, getPowerUpColor(type), "PowerUp");
            this.type = type;
            this.width = 15;
            this.height = 15;
            this.yFloat = y;
        }
        
        private static Color getPowerUpColor(String type) {
            switch (type) {
                case "Health":
                    return GameColors.SUCCESS_GREEN;
                case "Shield":
                    return GameColors.ACCENT_YELLOW;
                case "Speed":
                    return new Color(0x7FDBFF); // Light blue
                default:
                    return Color.WHITE;
            }
        }
        
        @Override
        public void draw(Graphics g) {
            g.setColor(color);
            
            switch (type) {
                case "Health":
                    // Health power-up (cross shape)
                    g.fillRect(x + 5, y, 5, 15);
                    g.fillRect(x, y + 5, 15, 5);
                    break;
                case "Shield":
                    // Shield power-up (shield shape)
                    g.fillOval(x, y, 15, 15);
                    g.setColor(GameColors.BACKGROUND);
                    g.fillOval(x + 3, y + 3, 9, 9);
                    break;
                case "Speed":
                    // Speed power-up (lightning bolt)
                    int[] xPoints = {x + 7, x + 3, x + 7, x + 3, x + 12, x + 8, x + 12};
                    int[] yPoints = {y, y + 5, y + 5, y + 10, y + 5, y + 5, y};
                    g.fillPolygon(xPoints, yPoints, 7);
                    break;
                default:
                    g.fillOval(x, y, 15, 15);
            }
        }
        
        public void move() {
            yFloat += ySpeed;
            y = (int)yFloat;
        }
    }
    
    /**
     * Main method to start the game.
     */
    public static void main(String[] args) {
        JFrame frame = new JFrame("Shape Shifter Duel");
        ShapeShifterDuel game = new ShapeShifterDuel();
        frame.add(game);
        frame.setSize(500, 500);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);
    }
}
