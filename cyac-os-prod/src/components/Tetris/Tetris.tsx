import React, { useState, useEffect, useRef } from 'react';
import styles from './Tetris.module.css';

interface TetrisProps {
    hasKeyboardFocus?: boolean;
}

// Tetris game component
const Tetris: React.FC<TetrisProps> = ({ hasKeyboardFocus = false }) => {
    // Game constants
    const GRID_WIDTH = 10;
    const GRID_HEIGHT = 20;
    const BLOCK_SIZE = 20;
    const TICK_RATE_MS = 500;

    // Tetromino shapes
    const SHAPES = [
        // I
        [[1, 1, 1, 1]],
        // O
        [
            [1, 1],
            [1, 1],
        ],
        // T
        [
            [0, 1, 0],
            [1, 1, 1],
        ],
        // J
        [
            [1, 0, 0],
            [1, 1, 1],
        ],
        // L
        [
            [0, 0, 1],
            [1, 1, 1],
        ],
        // S
        [
            [0, 1, 1],
            [1, 1, 0],
        ],
        // Z
        [
            [1, 1, 0],
            [0, 1, 1],
        ],
    ];

    // Game state
    const [grid, setGrid] = useState<number[][]>([]);
    const [currentPiece, setCurrentPiece] = useState<{
        shape: number[][];
        position: { x: number; y: number };
    } | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [nextPiece, setNextPiece] = useState<number[][]>([]);
    const [highScore, setHighScore] = useState(0);

    // Game loop reference
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

    // Load high score from local storage on component mount
    useEffect(() => {
        try {
            const savedHighScore = localStorage.getItem('cyac-tetris-high-score');
            if (savedHighScore) {
                setHighScore(parseInt(savedHighScore, 10));
            }
        } catch (error) {
            console.warn('Failed to load high score:', error);
        }
    }, []);

    // Save high score to local storage when updated
    useEffect(() => {
        try {
            localStorage.setItem('cyac-tetris-high-score', highScore.toString());
        } catch (error) {
            console.warn('Failed to save high score:', error);
        }
    }, [highScore]);

    // Initialize game
    const initializeGame = () => {
        // Create empty grid
        const newGrid: number[][] = Array(GRID_HEIGHT).fill(0).map(() => Array(GRID_WIDTH).fill(0));
        setGrid(newGrid);

        // Generate first piece
        const firstShape = getRandomShape();
        setCurrentPiece({
            shape: firstShape,
            position: {
                x: Math.floor(GRID_WIDTH / 2) - Math.floor(firstShape[0].length / 2),
                y: 0,
            },
        });

        // Generate next piece
        setNextPiece(getRandomShape());

        // Reset game state
        setGameOver(false);
        setPaused(false);
        setScore(0);
        setLevel(1);
        setLines(0);
    };

    // Get a random tetromino shape
    const getRandomShape = (): number[][] => {
        return SHAPES[Math.floor(Math.random() * SHAPES.length)];
    };

    // Start a new game
    const startGame = () => {
        initializeGame();

        // Start game loop
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
        }

        gameLoopRef.current = setInterval(tick, TICK_RATE_MS);
    };

    // Game tick function
    const tick = () => {
        if (paused || gameOver) return;

        movePieceDown();
    };

    // Check if piece can be placed at position
    const canPlace = (
        shape: number[][],
        position: { x: number; y: number }
    ): boolean => {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridX = position.x + x;
                    const gridY = position.y + y;

                    // Check if out of bounds or colliding with existing blocks
                    if (
                        gridX < 0 ||
                        gridX >= GRID_WIDTH ||
                        gridY >= GRID_HEIGHT ||
                        (gridY >= 0 && grid[gridY][gridX])
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    // Place current piece on grid
    const placePiece = () => {
        if (!currentPiece) return;

        const { shape, position } = currentPiece;
        const newGrid = [...grid.map(row => [...row])];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridX = position.x + x;
                    const gridY = position.y + y;

                    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                        newGrid[gridY][gridX] = 1;
                    }
                }
            }
        }

        setGrid(newGrid);

        // Check for completed lines
        const completedLines = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            if (newGrid[y].every(cell => cell === 1)) {
                completedLines.push(y);
            }
        }

        if (completedLines.length > 0) {
            // Remove completed lines
            const updatedGrid = [...newGrid];
            completedLines.forEach(line => {
                updatedGrid.splice(line, 1);
                updatedGrid.unshift(Array(GRID_WIDTH).fill(0));
            });

            // Update score and level
            const newLines = lines + completedLines.length;
            const linesScore = completedLines.length === 1 ? 100 : completedLines.length === 2 ? 300 : completedLines.length === 3 ? 500 : 800;
            const newScore = score + linesScore * level;

            setGrid(updatedGrid);
            setScore(newScore);
            setLines(newLines);
            setLevel(Math.floor(newLines / 10) + 1);

            // Update high score if needed
            if (newScore > highScore) {
                setHighScore(newScore);
            }
        }

        // Spawn next piece
        const nextShape = nextPiece;
        const newPiece = {
            shape: nextShape,
            position: {
                x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextShape[0].length / 2),
                y: 0,
            },
        };

        // Check if game is over
        if (!canPlace(nextShape, newPiece.position)) {
            setGameOver(true);
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
        } else {
            setCurrentPiece(newPiece);
            setNextPiece(getRandomShape());
        }
    };

    // Move piece down
    const movePieceDown = () => {
        if (!currentPiece || paused || gameOver) return;

        const newPosition = {
            x: currentPiece.position.x,
            y: currentPiece.position.y + 1,
        };

        if (canPlace(currentPiece.shape, newPosition)) {
            setCurrentPiece({
                ...currentPiece,
                position: newPosition,
            });
        } else {
            placePiece();
        }
    };

    // Move piece left
    const movePieceLeft = () => {
        if (!currentPiece || paused || gameOver) return;

        const newPosition = {
            x: currentPiece.position.x - 1,
            y: currentPiece.position.y,
        };

        if (canPlace(currentPiece.shape, newPosition)) {
            setCurrentPiece({
                ...currentPiece,
                position: newPosition,
            });
        }
    };

    // Move piece right
    const movePieceRight = () => {
        if (!currentPiece || paused || gameOver) return;

        const newPosition = {
            x: currentPiece.position.x + 1,
            y: currentPiece.position.y,
        };

        if (canPlace(currentPiece.shape, newPosition)) {
            setCurrentPiece({
                ...currentPiece,
                position: newPosition,
            });
        }
    };

    // Rotate piece
    const rotatePiece = () => {
        if (!currentPiece || paused || gameOver) return;

        // Transpose and reverse rows to rotate 90 degrees clockwise
        const rotated = currentPiece.shape[0].map((_, colIndex) =>
            currentPiece.shape.map(row => row[colIndex]).reverse()
        );

        if (canPlace(rotated, currentPiece.position)) {
            setCurrentPiece({
                ...currentPiece,
                shape: rotated,
            });
        }
    };

    // Drop piece (move all the way down)
    const dropPiece = () => {
        if (!currentPiece || paused || gameOver) return;

        let newY = currentPiece.position.y;

        // Find the lowest valid position
        while (canPlace(currentPiece.shape, { x: currentPiece.position.x, y: newY + 1 })) {
            newY++;
        }

        setCurrentPiece({
            ...currentPiece,
            position: {
                x: currentPiece.position.x,
                y: newY,
            },
        });

        // Place the piece immediately after dropping
        setTimeout(placePiece, 0);
    };

    // Toggle pause
    const togglePause = () => {
        if (gameOver) return;

        setPaused(!paused);
    };

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hasKeyboardFocus) return;

            switch (e.key) {
                case 'ArrowLeft':
                    movePieceLeft();
                    break;
                case 'ArrowRight':
                    movePieceRight();
                    break;
                case 'ArrowDown':
                    movePieceDown();
                    break;
                case 'ArrowUp':
                    rotatePiece();
                    break;
                case ' ': // Space
                    dropPiece();
                    break;
                case 'p':
                case 'P':
                    togglePause();
                    break;
                case 'r':
                case 'R':
                    startGame();
                    break;
            }
        };

        // Attach keyboard handler
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentPiece, grid, paused, gameOver, hasKeyboardFocus]);

    // Update game speed based on level
    useEffect(() => {
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
        }

        if (!gameOver && !paused) {
            const speed = Math.max(100, TICK_RATE_MS - (level - 1) * 50); // Increase speed with level
            gameLoopRef.current = setInterval(tick, speed);
        }

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
        };
    }, [level, gameOver, paused]);

    // Initialize game on first render
    useEffect(() => {
        startGame();

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
        };
    }, []);

    // Render game grid with current piece
    const renderGrid = () => {
        // Create a copy of the grid
        const renderGrid = grid.map(row => [...row]);

        // Add current piece to the render grid
        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const gridX = currentPiece.position.x + x;
                        const gridY = currentPiece.position.y + y;

                        if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                            renderGrid[gridY][gridX] = 2; // 2 represents the active piece
                        }
                    }
                }
            }
        }

        return (
            <div className={styles.grid}>
                {renderGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.row}>
                        {row.map((cell, cellIndex) => (
                            <div
                                key={cellIndex}
                                className={`${styles.cell} ${
                                    cell === 1 ? styles.placed : cell === 2 ? styles.active : ''
                                }`}
                                style={{
                                    width: `${BLOCK_SIZE}px`,
                                    height: `${BLOCK_SIZE}px`,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    // Render next piece preview
    const renderNextPiece = () => {
        return (
            <div className={styles.nextPiecePreview}>
                {nextPiece.map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.row}>
                        {row.map((cell, cellIndex) => (
                            <div
                                key={cellIndex}
                                className={`${styles.previewCell} ${cell ? styles.active : ''}`}
                                style={{
                                    width: `${BLOCK_SIZE - 2}px`,
                                    height: `${BLOCK_SIZE - 2}px`,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.tetrisGame}>
            <div className={styles.gameContainer}>
                <div className={styles.gameArea}>
                    {renderGrid()}

                    {(gameOver || paused) && (
                        <div className={styles.overlay}>
                            {gameOver ? (
                                <>
                                    <div className={styles.gameOverText}>GAME OVER</div>
                                    <button className={styles.button} onClick={startGame}>
                                        NEW GAME
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className={styles.pausedText}>PAUSED</div>
                                    <button className={styles.button} onClick={togglePause}>
                                        RESUME
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.scorePanel}>
                        <div className={styles.scoreLine}>
                            <span>SCORE:</span>
                            <span>{score}</span>
                        </div>
                        <div className={styles.scoreLine}>
                            <span>LINES:</span>
                            <span>{lines}</span>
                        </div>
                        <div className={styles.scoreLine}>
                            <span>LEVEL:</span>
                            <span>{level}</span>
                        </div>
                        <div className={styles.highScore}>
                            <span>HIGH SCORE:</span>
                            <span>{highScore}</span>
                        </div>
                    </div>

                    <div className={styles.nextPiecePanel}>
                        <div className={styles.panelLabel}>NEXT</div>
                        {renderNextPiece()}
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.panelLabel}>CONTROLS</div>
                        <div className={styles.controlsList}>
                            <div className={styles.controlItem}>
                                <span>↑</span>
                                <span>Rotate</span>
                            </div>
                            <div className={styles.controlItem}>
                                <span>←→</span>
                                <span>Move</span>
                            </div>
                            <div className={styles.controlItem}>
                                <span>↓</span>
                                <span>Down</span>
                            </div>
                            <div className={styles.controlItem}>
                                <span>Space</span>
                                <span>Drop</span>
                            </div>
                            <div className={styles.controlItem}>
                                <span>P</span>
                                <span>Pause</span>
                            </div>
                            <div className={styles.controlItem}>
                                <span>R</span>
                                <span>Restart</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.buttonPanel}>
                        <button className={styles.button} onClick={togglePause}>
                            {paused ? 'RESUME' : 'PAUSE'}
                        </button>
                        <button className={styles.button} onClick={startGame}>
                            NEW GAME
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.mobileControls}>
                <button className={styles.mobileButton} onClick={movePieceLeft}>←</button>
                <button className={styles.mobileButton} onClick={rotatePiece}>↑</button>
                <button className={styles.mobileButton} onClick={movePieceDown}>↓</button>
                <button className={styles.mobileButton} onClick={movePieceRight}>→</button>
                <button className={styles.mobileButton} onClick={dropPiece}>DROP</button>
            </div>
        </div>
    );
};

export default Tetris;