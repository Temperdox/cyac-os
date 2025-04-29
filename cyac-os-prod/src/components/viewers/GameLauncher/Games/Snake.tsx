import React, { useState, useEffect, useRef } from 'react';
import styles from './Snake.module.css';

// Define game metadata
export const gameMetadata = {
    id: 'snake',
    title: 'Snake',
    description: 'Control a snake to eat apples and grow longer',
    coverImage: '/game-covers/snake.png',
    developer: 'CyberAcme',
    releaseDate: '2025',
    collections: ['arcade', 'retro'],
    features: ['singleplayer', 'high-scores']
};

// Direction types
// Position interface
interface Position {
    x: number;
    y: number;
}

// Food types
interface FoodType {
    points: number;
    color: string;
    growthFactor: number;
    chance?: number;
}

interface Food extends Position {
    type: FoodType;
}

// Component props type
interface SnakeProps {
    onExit?: () => void;
    hasKeyboardFocus?: boolean;
}

const Snake: React.FC<SnakeProps> = ({ onExit, hasKeyboardFocus = true }) => {
    // Container and canvas refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopInterval = useRef<number | null>(null);

    // Constants
    const DIRECTIONS = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    };

    const FOOD_TYPES = {
        NORMAL: { points: 1, color: '#ff3333', growthFactor: 1 },
        SPECIAL: { points: 5, color: '#ffff33', growthFactor: 3, chance: 0.2 }
    };

    // State variables
    const [gridSize, setGridSize] = useState(20);
    const [cellSize, setCellSize] = useState(15);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const savedHighScore = localStorage.getItem('snakeHighScore');
        return savedHighScore ? parseInt(savedHighScore, 10) : 0;
    });
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [snake, setSnake] = useState<Position[]>([
        { x: 5, y: 7 },
        { x: 4, y: 7 },
        { x: 3, y: 7 }
    ]);
    const [food, setFood] = useState<Food | null>(null);
    const [direction, setDirection] = useState<{ x: number; y: number }>(DIRECTIONS.RIGHT);
    const [gameSpeed, setGameSpeed] = useState(150);
    const [level, setLevel] = useState(1);
    const [message, setMessage] = useState('');
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [gameStarted, setGameStarted] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Refs to avoid stale closures
    const directionRef = useRef(direction);
    const snakeRef = useRef(snake);
    const foodRef = useRef(food);
    const isPausedRef = useRef(isPaused);
    const gameOverRef = useRef(gameOver);
    const gameSpeedRef = useRef(gameSpeed);
    const gridSizeRef = useRef(gridSize);
    const specialFoodTimerRef = useRef<number | null>(null);
    const resizeTimeoutRef = useRef<number | null>(null);
    const gameStartedRef = useRef(gameStarted);

    // Update refs when state changes
    useEffect(() => {
        directionRef.current = direction;
        snakeRef.current = snake;
        foodRef.current = food;
        isPausedRef.current = isPaused;
        gameOverRef.current = gameOver;
        gameSpeedRef.current = gameSpeed;
        gridSizeRef.current = gridSize;
        gameStartedRef.current = gameStarted;
    }, [direction, snake, food, isPaused, gameOver, gameSpeed, gridSize, gameStarted]);

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hasKeyboardFocus || !gameStartedRef.current) return;
            if (gameOverRef.current && e.key !== ' ') return;

            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    if (
                        directionRef.current.y !== 1 && // Prevent 180° turns
                        !(directionRef.current.x === 0 && directionRef.current.y === 1) // Alternative check
                    ) {
                        setDirection(DIRECTIONS.UP);
                        directionRef.current = DIRECTIONS.UP;
                    }
                    e.preventDefault();
                    break;
                case 'arrowdown':
                case 's':
                    if (
                        directionRef.current.y !== -1 &&
                        !(directionRef.current.x === 0 && directionRef.current.y === -1)
                    ) {
                        setDirection(DIRECTIONS.DOWN);
                        directionRef.current = DIRECTIONS.DOWN;
                    }
                    e.preventDefault();
                    break;
                case 'arrowleft':
                case 'a':
                    if (
                        directionRef.current.x !== 1 &&
                        !(directionRef.current.x === 1 && directionRef.current.y === 0)
                    ) {
                        setDirection(DIRECTIONS.LEFT);
                        directionRef.current = DIRECTIONS.LEFT;
                    }
                    e.preventDefault();
                    break;
                case 'arrowright':
                case 'd':
                    if (
                        directionRef.current.x !== -1 &&
                        !(directionRef.current.x === -1 && directionRef.current.y === 0)
                    ) {
                        setDirection(DIRECTIONS.RIGHT);
                        directionRef.current = DIRECTIONS.RIGHT;
                    }
                    e.preventDefault();
                    break;
                case ' ': // Space
                    e.preventDefault();
                    if (gameOverRef.current) {
                        resetGame();
                    } else {
                        setIsPaused(!isPausedRef.current);
                        isPausedRef.current = !isPausedRef.current;
                        setMessage(isPausedRef.current ? 'PAUSED' : '');
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasKeyboardFocus]);

    // Initialize the game
    useEffect(() => {
        // Load high score from localStorage
        const savedHighScore = localStorage.getItem('snakeHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }

        // Initialize game after container measurements
        const initGame = () => {
            if (!containerRef.current) return;

            // Get and store container dimensions
            const rect = containerRef.current.getBoundingClientRect();
            setContainerDimensions({
                width: rect.width,
                height: rect.height
            });

            // Calculate optimal grid size
            calculateGridSize();

            // Initial setup
            resetGame();
        };

        // Allow the DOM to render first
        setTimeout(initGame, 100);

        // Handle window resize with debounce
        const handleResizeWithDebounce = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = window.setTimeout(() => {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setContainerDimensions({
                        width: rect.width,
                        height: rect.height
                    });
                    handleResize();
                }
            }, 200);
        };

        window.addEventListener('resize', handleResizeWithDebounce);

        // Clean up on unmount
        return () => {
            if (gameLoopInterval.current) {
                clearInterval(gameLoopInterval.current);
            }
            if (specialFoodTimerRef.current) {
                clearTimeout(specialFoodTimerRef.current);
            }
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            window.removeEventListener('resize', handleResizeWithDebounce);
        };
    }, []);

    // Handle container dimension changes
    useEffect(() => {
        if (containerDimensions.width > 0 && containerDimensions.height > 0) {
            calculateGridSize();
        }
    }, [containerDimensions]);

    // Calculate optimal grid size based on container
    const calculateGridSize = () => {
        if (!containerRef.current) return;

        // Get container dimensions
        const { width: containerWidth, height: containerHeight } = containerDimensions;

        // Reserve space for UI elements
        const titleHeight = 50;
        const controlsHeight = 80;
        const sidePadding = 30;

        // Calculate available space
        const availableWidth = containerWidth - sidePadding * 2;
        const availableHeight = containerHeight - titleHeight - controlsHeight;

        // Use the smaller dimension for a square grid
        const maxGridPixelSize = Math.min(availableWidth, availableHeight);

        // Ensure we have space
        if (maxGridPixelSize <= 0) {
            console.warn("Container too small for game grid");
            return;
        }

        // Calculate cell size (aim for 20x20 grid)
        let targetGridCells = 20;
        let newCellSize = Math.floor(maxGridPixelSize / targetGridCells);

        // Adjust if cells would be too small
        if (newCellSize < 12) {
            targetGridCells = Math.max(12, Math.floor(maxGridPixelSize / 12));
            newCellSize = Math.floor(maxGridPixelSize / targetGridCells);
        }
        // If cells would be too big
        else if (newCellSize > 20) {
            targetGridCells = Math.floor(maxGridPixelSize / 20);
            newCellSize = 20;
        }

        // Ensure grid fits
        const newGridSize = Math.floor(maxGridPixelSize / newCellSize);

        setCellSize(newCellSize);
        setGridSize(newGridSize);
        gridSizeRef.current = newGridSize;
    };

    // Handle resize
    const handleResize = () => {
        const oldGridSize = gridSizeRef.current;
        calculateGridSize();
        const newGridSize = gridSizeRef.current;

        // If grid size changed
        if (oldGridSize !== newGridSize) {
            // Scale snake position
            const scaleRatio = newGridSize / oldGridSize;
            const scaledSnake = snakeRef.current.map(segment => ({
                x: Math.min(Math.floor(segment.x * scaleRatio), newGridSize - 1),
                y: Math.min(Math.floor(segment.y * scaleRatio), newGridSize - 1)
            }));

            setSnake(scaledSnake);
            snakeRef.current = scaledSnake;

            // Reposition food
            if (foodRef.current) {
                const newFood = {
                    ...foodRef.current,
                    x: Math.min(Math.floor(foodRef.current.x * scaleRatio), newGridSize - 1),
                    y: Math.min(Math.floor(foodRef.current.y * scaleRatio), newGridSize - 1)
                };

                // Check if food overlaps with snake
                if (scaledSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
                    spawnFood();
                } else {
                    setFood(newFood);
                    foodRef.current = newFood;
                }
            }
        }
    };

    // Spawn food at a random position
    const spawnFood = () => {
        // Clear previous special food timer
        if (specialFoodTimerRef.current) {
            clearTimeout(specialFoodTimerRef.current);
            specialFoodTimerRef.current = null;
        }

        const currentGridSize = gridSizeRef.current;
        const currentSnake = snakeRef.current;

        // Check if any space left
        const totalCells = currentGridSize * currentGridSize;
        if (currentSnake.length >= totalCells - 1) {
            console.log("Game completed! Snake has filled the grid.");
            setGameOver(true);
            gameOverRef.current = true;
            if (score > highScore) {
                localStorage.setItem('snakeHighScore', score.toString());
                setHighScore(score);
            }
            setMessage('You won! The snake has filled the grid!');
            return;
        }

        // Choose food type
        const isSpecial = Math.random() < (FOOD_TYPES.SPECIAL.chance || 0);
        const foodType = isSpecial ? FOOD_TYPES.SPECIAL : FOOD_TYPES.NORMAL;

        // Find available positions
        const availablePositions: Position[] = [];
        for (let y = 0; y < currentGridSize; y++) {
            for (let x = 0; x < currentGridSize; x++) {
                if (!currentSnake.some(segment => segment.x === x && segment.y === y)) {
                    availablePositions.push({ x, y });
                }
            }
        }

        // Place food in random available position
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions[randomIndex];

            const newFood: Food = {
                ...position,
                type: foodType
            };

            setFood(newFood);
            foodRef.current = newFood;

            // Set timer for special food
            if (isSpecial) {
                specialFoodTimerRef.current = window.setTimeout(() => {
                    setFood(f => {
                        if (f && f.type === FOOD_TYPES.SPECIAL) {
                            foodRef.current = null;
                            setTimeout(() => {
                                if (!foodRef.current) spawnFood();
                            }, 100);
                            return null;
                        }
                        return f;
                    });
                }, 5000);
            }
        }
    };

    // Update game state
    const updateGame = () => {
        const currentSnake = [...snakeRef.current];
        const currentDirection = directionRef.current;
        const currentFood = foodRef.current;
        const currentGridSize = gridSizeRef.current;

        // Calculate new head position
        const head = { ...currentSnake[0] };
        head.x += currentDirection.x;
        head.y += currentDirection.y;

        // Wrap around grid edges
        if (head.x < 0) head.x = currentGridSize - 1;
        if (head.x >= currentGridSize) head.x = 0;
        if (head.y < 0) head.y = currentGridSize - 1;
        if (head.y >= currentGridSize) head.y = 0;

        // Check for collision with snake body
        if (currentSnake.slice(0, currentSnake.length - 1).some(segment =>
            segment.x === head.x && segment.y === head.y
        )) {
            setGameOver(true);
            gameOverRef.current = true;
            if (score > highScore) {
                localStorage.setItem('snakeHighScore', score.toString());
                setHighScore(score);
            }
            setMessage('Game Over! Press Space to restart');
            return;
        }

        // Add head to snake
        const newSnake = [head, ...currentSnake];

        // Check for food collision
        if (currentFood && head.x === currentFood.x && head.y === currentFood.y) {
            const points = currentFood.type.points;

            // Update score and level
            setScore(prev => {
                const next = prev + points;
                if (Math.floor(next / 50) > Math.floor(prev / 50)) {
                    const lvl = Math.floor(next / 50) + 1;
                    setLevel(lvl);

                    // Increase speed with level
                    const spd = Math.max(150 - (lvl - 1) * 10, 70);
                    setGameSpeed(spd);
                    gameSpeedRef.current = spd;

                    // Show level up message
                    setMessage(`Level ${lvl}!`);
                    setTimeout(() => setMessage(''), 1500);

                    // Update game loop
                    if (gameLoopInterval.current) {
                        clearInterval(gameLoopInterval.current);
                        startGameLoop();
                    }
                }
                return next;
            });

            // Grow snake
            for (let i = 1; i < currentFood.type.growthFactor; i++) {
                const last = newSnake[newSnake.length - 1];
                newSnake.push({ ...last });
            }

            // Clear special food timer
            if (currentFood.type === FOOD_TYPES.SPECIAL && specialFoodTimerRef.current) {
                clearTimeout(specialFoodTimerRef.current);
                specialFoodTimerRef.current = null;
            }

            // Spawn new food
            spawnFood();
        } else {
            // Remove tail if no food eaten
            newSnake.pop();
        }

        // Update snake state
        setSnake(newSnake);
        snakeRef.current = newSnake;
    };

    // Start game loop
    const startGameLoop = () => {
        if (gameLoopInterval.current) {
            clearInterval(gameLoopInterval.current);
        }

        gameLoopInterval.current = window.setInterval(() => {
            if (!isPausedRef.current && !gameOverRef.current && gameStartedRef.current) {
                updateGame();
            }
        }, gameSpeedRef.current);
    };

    // Reset the game
    const resetGame = () => {
        // Clear timers
        if (specialFoodTimerRef.current) {
            clearTimeout(specialFoodTimerRef.current);
            specialFoodTimerRef.current = null;
        }

        // Position snake in first quarter
        const currentGridSize = gridSizeRef.current;
        const centerX = Math.floor(currentGridSize / 4);
        const centerY = Math.floor(currentGridSize / 2);

        const initialSnake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];

        // Reset game state
        setSnake(initialSnake);
        snakeRef.current = initialSnake;
        setDirection(DIRECTIONS.RIGHT);
        directionRef.current = DIRECTIONS.RIGHT;
        setScore(0);
        setGameOver(false);
        gameOverRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setGameSpeed(150);
        gameSpeedRef.current = 150;
        setLevel(1);
        setMessage('');
        setGameStarted(true);
        gameStartedRef.current = true;

        // Clear food
        setFood(null);
        foodRef.current = null;

        // Spawn new food and start game
        setTimeout(() => {
            spawnFood();
            startGameLoop();
        }, 50);
    };

    // Toggle pause
    const togglePause = () => {
        if (gameOverRef.current) {
            resetGame();
        } else {
            setIsPaused(!isPausedRef.current);
            isPausedRef.current = !isPausedRef.current;
            setMessage(isPausedRef.current ? 'PAUSED' : '');
        }
    };

    // Handle direction button clicks
    const handleDirectionButtonClick = (dir: typeof DIRECTIONS.UP | typeof DIRECTIONS.DOWN | typeof DIRECTIONS.LEFT | typeof DIRECTIONS.RIGHT) => {
        // Prevent 180° turns
        const curr = directionRef.current;

        if (
            (dir === DIRECTIONS.UP && curr.y !== 1) ||
            (dir === DIRECTIONS.DOWN && curr.y !== -1) ||
            (dir === DIRECTIONS.LEFT && curr.x !== 1) ||
            (dir === DIRECTIONS.RIGHT && curr.x !== -1)
        ) {
            setDirection(dir);
            directionRef.current = dir;
        }
    };

    // Prevent default on button clicks
    const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    // Draw the game
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, gridSize * cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(gridSize * cellSize, y * cellSize);
            ctx.stroke();
        }

        // Draw the snake
        snake.forEach((segment, index) => {
            if (
                segment.x < 0 ||
                segment.x >= gridSize ||
                segment.y < 0 ||
                segment.y >= gridSize
            ) {
                return; // Skip out-of-bounds segments
            }

            // Color gradient from head to tail
            if (index === 0) {
                ctx.fillStyle = '#33ff33'; // Bright green for head
            } else {
                const greenValue = Math.max(200 - (index * 6), 50);
                ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
            }

            // Draw segment
            ctx.beginPath();
            ctx.fillRect(
                segment.x * cellSize + 1,
                segment.y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
            ctx.fill();

            // Draw eyes on head
            if (index === 0) {
                ctx.fillStyle = '#000';

                // Eye positions based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                const eyeOffset = Math.max(2, Math.floor(cellSize / 6));
                const eyeSize = Math.max(1, Math.floor(cellSize / 9));

                if (direction.y === -1) {
                    // UP
                    leftEyeX = segment.x * cellSize + eyeOffset * 2;
                    leftEyeY = segment.y * cellSize + eyeOffset * 2;
                    rightEyeX = segment.x * cellSize + cellSize - eyeOffset * 2;
                    rightEyeY = segment.y * cellSize + eyeOffset * 2;
                } else if (direction.y === 1) {
                    // DOWN
                    leftEyeX = segment.x * cellSize + eyeOffset * 2;
                    leftEyeY = segment.y * cellSize + cellSize - eyeOffset * 2;
                    rightEyeX = segment.x * cellSize + cellSize - eyeOffset * 2;
                    rightEyeY = segment.y * cellSize + cellSize - eyeOffset * 2;
                } else if (direction.x === -1) {
                    // LEFT
                    leftEyeX = segment.x * cellSize + eyeOffset * 2;
                    leftEyeY = segment.y * cellSize + eyeOffset * 2;
                    rightEyeX = segment.x * cellSize + eyeOffset * 2;
                    rightEyeY = segment.y * cellSize + cellSize - eyeOffset * 2;
                } else {
                    // RIGHT
                    leftEyeX = segment.x * cellSize + cellSize - eyeOffset * 2;
                    leftEyeY = segment.y * cellSize + eyeOffset * 2;
                    rightEyeX = segment.x * cellSize + cellSize - eyeOffset * 2;
                    rightEyeY = segment.y * cellSize + cellSize - eyeOffset * 2;
                }

                // Draw eyes
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw the food
        if (food) {
            ctx.fillStyle = food.type.color;

            if (food.type === FOOD_TYPES.NORMAL) {
                // Normal food is a circle
                ctx.beginPath();
                ctx.arc(
                    food.x * cellSize + cellSize / 2,
                    food.y * cellSize + cellSize / 2,
                    cellSize / 2 - 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                // Special food is a star
                const centerX = food.x * cellSize + cellSize / 2;
                const centerY = food.y * cellSize + cellSize / 2;
                const outerRadius = cellSize / 2 - 2;
                const innerRadius = outerRadius / 2;
                const spikes = 5;

                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * i) / spikes;
                    const x = centerX + radius * Math.sin(angle);
                    const y = centerY + radius * Math.cos(angle);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.closePath();
                ctx.fill();

                // Add glow effect
                ctx.shadowColor = food.type.color;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }, [snake, food, direction, gameOver, gridSize, cellSize]);

    return (
        <div className={styles.snakeGame} ref={containerRef}>
            <div className={styles.gameHeader}>
                <h1 className={styles.title}>SNAKE</h1>
                {gameStarted && (
                    <div className={styles.status}>
                        {gameOver ? 'GAME OVER' : isPaused ? 'PAUSED' : `LEVEL ${level}`}
                    </div>
                )}
            </div>

            <div className={styles.scorePanel}>
                <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>SCORE</span>
                    <span className={styles.scoreValue}>{score}</span>
                </div>
                <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>HIGH SCORE</span>
                    <span className={styles.scoreValue}>{highScore}</span>
                </div>
            </div>

            <div className={styles.gameArea}>
                <div
                    className={styles.gameCanvas}
                    style={{
                        width: `${gridSize * cellSize}px`,
                        height: `${gridSize * cellSize}px`
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={gridSize * cellSize}
                        height={gridSize * cellSize}
                        className={styles.canvas}
                    />

                    {message && (
                        <div className={styles.messageOverlay}>
                            {message}
                        </div>
                    )}

                    {gameOver && (
                        <div className={styles.gameOverOverlay}>
                            <h2>GAME OVER</h2>
                            <p>Score: {score}</p>
                            {score > 0 && score >= highScore && (
                                <p className={styles.newHighScore}>NEW HIGH SCORE!</p>
                            )}
                            <button
                                className={styles.gameButton}
                                onClick={(e) => handleButtonClick(e, resetGame)}
                            >
                                PLAY AGAIN
                            </button>
                        </div>
                    )}

                    {isPaused && !gameOver && (
                        <div className={styles.pauseOverlay}>
                            <h2>PAUSED</h2>
                            <button
                                className={styles.gameButton}
                                onClick={(e) => handleButtonClick(e, togglePause)}
                            >
                                RESUME
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.controlsPanel}>
                <div className={styles.buttonRow}>
                    <button
                        className={styles.gameButton}
                        onClick={(e) => handleButtonClick(e, togglePause)}
                    >
                        {gameOver ? 'RESTART' : (isPaused ? 'RESUME' : 'PAUSE')}
                    </button>

                    <button
                        className={styles.gameButton}
                        onClick={(e) => handleButtonClick(e, () => setShowControls(prev => !prev))}
                    >
                        {showControls ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}
                    </button>

                    <button
                        className={styles.gameButton}
                        onClick={onExit}
                    >
                        EXIT
                    </button>
                </div>

                {showControls && (
                    <div className={styles.touchControls}>
                        <div className={styles.controlsRow}>
                            <button
                                className={styles.directionButton}
                                onClick={(e) => handleButtonClick(e, () => handleDirectionButtonClick(DIRECTIONS.UP))}
                            >
                                ▲
                            </button>
                        </div>
                        <div className={styles.controlsRow}>
                            <button
                                className={styles.directionButton}
                                onClick={(e) => handleButtonClick(e, () => handleDirectionButtonClick(DIRECTIONS.LEFT))}
                            >
                                ◄
                            </button>
                            <div className={styles.spacer}></div>
                            <button
                                className={styles.directionButton}
                                onClick={(e) => handleButtonClick(e, () => handleDirectionButtonClick(DIRECTIONS.RIGHT))}
                            >
                                ►
                            </button>
                        </div>
                        <div className={styles.controlsRow}>
                            <button
                                className={styles.directionButton}
                                onClick={(e) => handleButtonClick(e, () => handleDirectionButtonClick(DIRECTIONS.DOWN))}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.instructions}>
                <p><span className={styles.key}>←→↑↓</span> Control snake | <span className={styles.key}>Space</span> Pause | Eat apples to grow and increase your score</p>
            </div>
        </div>
    );
};

export default Snake;