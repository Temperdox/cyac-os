import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Tetris.module.css';

// Define game metadata
export const gameMetadata = {
    id: 'tetris',
    title: 'Tetris',
    description: 'Classic block-stacking puzzle game',
    coverImage: '/game-covers/tetris.png',
    developer: 'CyberAcme',
    releaseDate: '2025',
    collections: ['arcade', 'puzzle'],
    features: ['singleplayer', 'high-scores']
};

// Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_SPEED_MS = 800; // ms - normal speed
const SOFT_DROP_SPEED = 50; // ms - speed when pressing down

// Tetromino shapes with proper typing
interface TetrominoData {
    shape: number[][];
    color: string;
}

interface TetrominoPiece {
    shape: number[][];
    color: string;
    pos: { x: number; y: number };
}

// Tetromino types
type TetrominoKey = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// Tetrominos definition
const TETROMINOS: Record<TetrominoKey, TetrominoData> = {
    I: {
        shape: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0]
        ],
        color: '#33ffff' // Cyan
    },
    J: {
        shape: [
            [0,0,0],
            [2,2,2],
            [0,0,2]
        ],
        color: '#3333ff' // Blue
    },
    L: {
        shape: [
            [0,0,0],
            [3,3,3],
            [3,0,0]
        ],
        color: '#ff9933' // Orange
    },
    O: {
        shape: [
            [4,4],
            [4,4]
        ],
        color: '#ffff33' // Yellow
    },
    S: {
        shape: [
            [0,0,0],
            [0,5,5],
            [5,5,0]
        ],
        color: '#33ff33' // Green
    },
    T: {
        shape: [
            [0,0,0],
            [6,6,6],
            [0,6,0]
        ],
        color: '#9933ff' // Purple
    },
    Z: {
        shape: [
            [0,0,0],
            [7,7,0],
            [0,7,7]
        ],
        color: '#ff3333' // Red
    }
};

// Component props definition
interface TetrisProps {
    onExit?: () => void;
}

// Create an empty board
const createEmptyBoard = (): number[][] =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

// Get a random tetromino
const getRandomTetromino = (): TetrominoPiece => {
    const keys = Object.keys(TETROMINOS) as TetrominoKey[];
    const key = keys[Math.floor(Math.random() * keys.length)];

    // Create a deep copy of the shape to avoid reference issues
    const shapeCopy = TETROMINOS[key].shape.map(row => [...row]);

    return {
        shape: shapeCopy,
        color: TETROMINOS[key].color,
        pos: { x: Math.floor(BOARD_WIDTH/2) - 2, y: 0 }
    };
};

const Tetris: React.FC<TetrisProps> = ({ onExit }) => {
    // Game state
    const [board, setBoard] = useState<number[][]>(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState<TetrominoPiece | null>(null);
    const [nextPiece, setNextPiece] = useState<TetrominoPiece | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [paused, setPaused] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [linesCleared, setLinesCleared] = useState<number>(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [tickSpeed, setTickSpeed] = useState<number>(TICK_SPEED_MS);
    const [highScore, setHighScore] = useState<number>(() => {
        const saved = localStorage.getItem('tetrisHighScore');
        return saved ? parseInt(saved) : 0;
    });

    // Soft drop state - true when down arrow is pressed
    const [softDropActive, setSoftDropActive] = useState<boolean>(false);

    // Refs for stable closures
    const boardRef = useRef<number[][]>(board);
    boardRef.current = board;
    const currentRef = useRef<TetrominoPiece | null>(currentPiece);
    currentRef.current = currentPiece;
    const pausedRef = useRef<boolean>(paused);
    pausedRef.current = paused;
    const gameOverRef = useRef<boolean>(gameOver);
    gameOverRef.current = gameOver;
    const startedRef = useRef<boolean>(gameStarted);
    startedRef.current = gameStarted;
    const tickSpeedRef = useRef<number>(tickSpeed);
    tickSpeedRef.current = tickSpeed;
    const softDropRef = useRef<boolean>(softDropActive);
    softDropRef.current = softDropActive;

    // Timing refs
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number>(0);
    const elapsedTimeRef = useRef<number>(0);

    // Check for collisions
    const checkCollision = useCallback((shape: number[][], pos: {x: number, y: number}): boolean => {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;
                const boardX = pos.x + x;
                const boardY = pos.y + y;
                // Check if out of bounds
                if (
                    boardX < 0 ||
                    boardX >= BOARD_WIDTH ||
                    boardY >= BOARD_HEIGHT
                ) return true;
                // Check for collision with placed pieces
                if (boardY >= 0 && boardRef.current[boardY][boardX] !== 0) return true;
            }
        }
        return false;
    }, []);

    // Lock piece in place, check for lines, spawn next piece
    const lockPiece = useCallback((pieceToLock = currentRef.current): void => {
        if (!pieceToLock) return;

        const newBoard = boardRef.current.map(row => [...row]);

        // Add piece to board
        for (let y = 0; y < pieceToLock.shape.length; y++) {
            for (let x = 0; x < pieceToLock.shape[y].length; x++) {
                if (!pieceToLock.shape[y][x]) continue;

                const boardY = pieceToLock.pos.y + y;
                const boardX = pieceToLock.pos.x + x;

                // Game over if piece is locked above board
                if (boardY < 0) {
                    setGameOver(true);
                    gameOverRef.current = true;
                    setPaused(true);
                    pausedRef.current = true;

                    // Set high score if needed
                    if (score > highScore) {
                        localStorage.setItem('tetrisHighScore', score.toString());
                        setHighScore(score);
                    }
                    return;
                }

                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    newBoard[boardY][boardX] = pieceToLock.shape[y][x];
                }
            }
        }

        setBoard(newBoard);
        boardRef.current = newBoard;

        // Check for lines
        let lines = 0;
        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (newBoard[row].every(cell => cell !== 0)) {
                lines++;
                // Move all rows above down
                for (let r = row; r > 0; r--) {
                    newBoard[r] = [...newBoard[r-1]];
                }
                // Add empty row at top
                newBoard[0] = Array(BOARD_WIDTH).fill(0);
                row++; // recheck this row
            }
        }

        // Update score if lines were cleared
        if (lines > 0) {
            const pointsTable = [0, 40, 100, 300, 1200]; // Score for 0,1,2,3,4 lines
            const newScore = score + pointsTable[lines] * level;
            const totalLines = linesCleared + lines;
            const newLevel = Math.floor(totalLines / 10) + 1;

            setScore(newScore);
            setLinesCleared(totalLines);

            // Level up and increase speed
            if (newLevel > level) {
                setLevel(newLevel);
                const newSpeed = Math.max(100, TICK_SPEED_MS - (newLevel - 1) * 50);
                setTickSpeed(newSpeed);
                tickSpeedRef.current = newSpeed;
            }

            setBoard(newBoard);
            boardRef.current = newBoard;
        }

        // Spawn next piece
        const next = nextPiece || getRandomTetromino();
        if (checkCollision(next.shape, next.pos)) {
            setGameOver(true);
            gameOverRef.current = true;
            setPaused(true);
            pausedRef.current = true;

            // Set high score if needed
            if (score > highScore) {
                localStorage.setItem('tetrisHighScore', score.toString());
                setHighScore(score);
            }
            return;
        }

        setCurrentPiece(next);
        setNextPiece(getRandomTetromino());
    }, [score, level, linesCleared, highScore, nextPiece, checkCollision]);

    // Rotate piece clockwise with wall kicks
    const rotatePiece = useCallback((): void => {
        if (!currentPiece || pausedRef.current || gameOverRef.current) return;

        // Make a deep copy of the shape to avoid reference issues
        const shape = currentPiece.shape.map(row => [...row]);

        // Transpose + reverse = 90° clockwise rotation
        const rotated = Array(shape[0].length).fill(0).map((_, colIndex) =>
            shape.map(row => row[colIndex])
        );

        // Reverse each row for clockwise rotation
        const clockwiseRotated = rotated.map(row => [...row].reverse());

        // Try normal rotation
        if (!checkCollision(clockwiseRotated, currentPiece.pos)) {
            setCurrentPiece({...currentPiece, shape: clockwiseRotated});
        } else {
            // Try wall kick to the left
            const leftPos = {...currentPiece.pos, x: currentPiece.pos.x - 1};
            if (!checkCollision(clockwiseRotated, leftPos)) {
                setCurrentPiece({...currentPiece, shape: clockwiseRotated, pos: leftPos});
            } else {
                // Try wall kick to the right
                const rightPos = {...currentPiece.pos, x: currentPiece.pos.x + 1};
                if (!checkCollision(clockwiseRotated, rightPos)) {
                    setCurrentPiece({...currentPiece, shape: clockwiseRotated, pos: rightPos});
                }
            }
        }
    }, [currentPiece, checkCollision]);

    // Move piece horizontally
    const movePiece = useCallback((dir: number): void => {
        if (!currentPiece || pausedRef.current || gameOverRef.current) return;

        const newPos = {...currentPiece.pos, x: currentPiece.pos.x + dir};
        if (!checkCollision(currentPiece.shape, newPos)) {
            setCurrentPiece({...currentPiece, pos: newPos});
        }
    }, [currentPiece, checkCollision]);

    // Drop piece one step - returns true if piece landed
    const dropPiece = useCallback((): boolean => {
        if (!currentPiece || pausedRef.current || gameOverRef.current) return false;

        const newPos = {...currentPiece.pos, y: currentPiece.pos.y + 1};
        if (!checkCollision(currentPiece.shape, newPos)) {
            setCurrentPiece({...currentPiece, pos: newPos});
            return false;
        } else {
            // Piece landed, lock it
            lockPiece(currentPiece);
            return true;
        }
    }, [currentPiece, checkCollision, lockPiece]);

    // Hard drop - instantly drop piece to lowest valid position
    const hardDrop = useCallback((): void => {
        if (!currentPiece || pausedRef.current || gameOverRef.current) return;

        let finalY = currentPiece.pos.y;
        while (!checkCollision(currentPiece.shape, {...currentPiece.pos, y: finalY + 1})) {
            finalY++;
        }

        const droppedPiece = {
            ...currentPiece,
            pos: {...currentPiece.pos, y: finalY}
        };

        setCurrentPiece(droppedPiece);
        lockPiece(droppedPiece);
    }, [currentPiece, checkCollision, lockPiece]);

    // Start a new game
    const startGame = useCallback((): void => {
        // Reset all game state
        const emptyBoard = createEmptyBoard();
        const firstPiece = getRandomTetromino();
        const secondPiece = getRandomTetromino();

        setBoard(emptyBoard);
        setCurrentPiece(firstPiece);
        setNextPiece(secondPiece);
        setGameOver(false);
        gameOverRef.current = false;
        setPaused(false);
        pausedRef.current = false;
        setScore(0);
        setLevel(1);
        setLinesCleared(0);
        setTickSpeed(TICK_SPEED_MS);
        tickSpeedRef.current = TICK_SPEED_MS;
        setGameStarted(true);
        startedRef.current = true;
        setSoftDropActive(false);
        softDropRef.current = false;

        // Reset animation timing
        lastTimeRef.current = 0;
        elapsedTimeRef.current = 0;

        // Force a single animation frame to jumpstart the loop
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        requestRef.current = requestAnimationFrame(gameLoop);
    }, []);

    // Pause/resume game
    const togglePause = useCallback((): void => {
        if (!gameOverRef.current && startedRef.current) {
            const newPausedState = !pausedRef.current;
            setPaused(newPausedState);
            pausedRef.current = newPausedState;
        }
    }, []);

    // Game loop using requestAnimationFrame
    const gameLoop = useCallback((timestamp: number): void => {
        // Initialize time tracking on first frame
        if (!lastTimeRef.current) {
            lastTimeRef.current = timestamp;
            requestRef.current = requestAnimationFrame(gameLoop);
            return; // Skip first frame to set up timing
        }

        const deltaTime = timestamp - lastTimeRef.current;
        elapsedTimeRef.current += deltaTime;

        // Get effective tick speed based on whether soft drop is active
        const effectiveTickSpeed = softDropRef.current ? SOFT_DROP_SPEED : tickSpeedRef.current;

        // Only process game logic when enough time has passed
        if (
            elapsedTimeRef.current > effectiveTickSpeed &&
            !pausedRef.current &&
            !gameOverRef.current &&
            startedRef.current
        ) {
            const pieceLocked = dropPiece();

            // Only reset timer if the piece wasn't locked
            if (!pieceLocked) {
                elapsedTimeRef.current = 0;
            } else {
                // If the piece was locked, allow a slight delay before the next piece drops
                elapsedTimeRef.current = effectiveTickSpeed * 0.8;
            }
        }

        lastTimeRef.current = timestamp;
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [dropPiece]);

    // Initialize the game loop
    useEffect(() => {
        // Start game automatically
        startGame();

        // Clean up on unmount
        return () => {
            if (requestRef.current !== undefined) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [startGame]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            // Skip if game over (except for "r" to restart)
            if (gameOverRef.current && e.key !== 'r' && e.key !== 'R') return;

            // Skip if modifier keys are pressed
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            switch (e.key) {
                case 'ArrowLeft':
                    movePiece(-1);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    movePiece(1);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    // Activate soft drop
                    setSoftDropActive(true);
                    softDropRef.current = true;
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    rotatePiece();
                    e.preventDefault();
                    break;
                case ' ': // Space
                    hardDrop();
                    e.preventDefault();
                    break;
                case 'p':
                case 'P':
                    togglePause();
                    e.preventDefault();
                    break;
                case 'r':
                case 'R':
                    startGame();
                    e.preventDefault();
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent): void => {
            // When arrow down is released, deactivate soft drop
            if (e.key === 'ArrowDown') {
                setSoftDropActive(false);
                softDropRef.current = false;
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [movePiece, rotatePiece, hardDrop, togglePause, startGame]);

    // Create display board with ghost piece and current piece
    const renderBoard = useCallback((): number[][] => {
        // Create a copy of the board
        const displayBoard = board.map(row => [...row]);

        // Add ghost piece (where the current piece would land)
        if (currentPiece && !gameOver) {
            let ghostY = currentPiece.pos.y;

            // Find the lowest valid position
            while (!checkCollision(
                currentPiece.shape,
                { ...currentPiece.pos, y: ghostY + 1 }
            )) {
                ghostY++;
            }

            // Only show ghost if it's not at the same position as current piece
            if (ghostY !== currentPiece.pos.y) {
                for (let y = 0; y < currentPiece.shape.length; y++) {
                    for (let x = 0; x < currentPiece.shape[y].length; x++) {
                        if (currentPiece.shape[y][x] !== 0) {
                            const boardY = ghostY + y;
                            const boardX = currentPiece.pos.x + x;

                            if (
                                boardY >= 0 &&
                                boardY < BOARD_HEIGHT &&
                                boardX >= 0 &&
                                boardX < BOARD_WIDTH
                            ) {
                                displayBoard[boardY][boardX] = -currentPiece.shape[y][x];
                            }
                        }
                    }
                }
            }

            // Add current piece to display board
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x] !== 0) {
                        const boardY = currentPiece.pos.y + y;
                        const boardX = currentPiece.pos.x + x;

                        // Only draw if within bounds
                        if (
                            boardY >= 0 &&
                            boardY < BOARD_HEIGHT &&
                            boardX >= 0 &&
                            boardX < BOARD_WIDTH
                        ) {
                            displayBoard[boardY][boardX] = currentPiece.shape[y][x];
                        }
                    }
                }
            }
        }

        return displayBoard;
    }, [board, currentPiece, gameOver, checkCollision]);

    // Get color for a cell based on its value
    const getCellColor = useCallback((value: number): string => {
        // Ghost piece (negative values)
        if (value < 0) {
            const tetroIndex = Math.abs(value);
            const keys = Object.keys(TETROMINOS) as TetrominoKey[];
            if (tetroIndex <= keys.length) {
                // Add alpha for transparency
                return TETROMINOS[keys[tetroIndex - 1]].color + '33';
            }
            return 'transparent';
        }

        // Normal pieces
        if (value > 0) {
            const keys = Object.keys(TETROMINOS) as TetrominoKey[];
            if (value <= keys.length) {
                return TETROMINOS[keys[value - 1]].color;
            }
        }

        return 'transparent';
    }, []);

    // Render the next piece preview
    const renderNextPiece = useCallback(() => {
        if (!nextPiece) return null;

        const grid = Array(4).fill(0).map(() => Array(4).fill(0));

        // Center the piece in the preview
        const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);

        // Draw the next piece in the preview grid
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x] !== 0) {
                    const previewX = x + offsetX;
                    const previewY = y + offsetY;
                    grid[previewY][previewX] = nextPiece.shape[y][x];
                }
            }
        }

        return (
            <div className={styles.nextPieceGrid}>
                {grid.map((row: number[], rowIndex: number) => (
                    <div key={`next-row-${rowIndex}`} className={styles.tetrisRow}>
                        {row.map((value: number, colIndex: number) => (
                            <div
                                key={`next-cell-${rowIndex}-${colIndex}`}
                                className={`${styles.tetrisCell} ${value !== 0 ? styles.filled : ''}`}
                                style={{ backgroundColor: getCellColor(value) }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }, [nextPiece, getCellColor]);

    // Handle button clicks without event bubbling
    const handleButtonClick = useCallback((
        e: React.MouseEvent<HTMLButtonElement>,
        callback: () => void
    ): void => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    }, []);

    return (
        <div className={styles.tetrisGame}>
            <div className={styles.gameHeader}>
                <h2>{gameMetadata.title}</h2>
                <span className={`${styles.gameStatus} ${paused ? styles.paused : styles.playing}`}>
          {!gameStarted
              ? 'PRESS START'
              : gameOver
                  ? 'GAME OVER'
                  : paused
                      ? 'PAUSED'
                      : 'PLAYING'
          }
        </span>
            </div>

            <div className={styles.gameArea}>
                <div className={styles.tetrisBoard}>
                    {renderBoard().map((row: number[], rowIndex: number) => (
                        <div key={`row-${rowIndex}`} className={styles.tetrisRow}>
                            {row.map((cell: number, colIndex: number) => (
                                <div
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    className={`${styles.tetrisCell} ${cell !== 0 ? styles.filled : ''} ${cell < 0 ? styles.ghost : ''}`}
                                    style={{ backgroundColor: getCellColor(cell) }}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <div className={styles.gameInfo}>
                    <div className={styles.scoreSection}>
                        <div className={styles.infoLabel}>SCORE</div>
                        <div className={styles.infoValue}>{score}</div>
                    </div>

                    <div className={styles.levelSection}>
                        <div className={styles.infoLabel}>LEVEL</div>
                        <div className={styles.infoValue}>{level}</div>
                    </div>

                    <div className={styles.linesSection}>
                        <div className={styles.infoLabel}>LINES</div>
                        <div className={styles.infoValue}>{linesCleared}</div>
                    </div>

                    <div className={styles.highScoreSection}>
                        <div className={styles.infoLabel}>HIGH SCORE</div>
                        <div className={styles.infoValue}>{highScore}</div>
                    </div>

                    <div className={styles.nextPieceSection}>
                        <div className={styles.infoLabel}>NEXT</div>
                        {renderNextPiece()}
                    </div>

                    <div className={styles.controlsInfo}>
                        <div className={styles.infoLabel}>CONTROLS</div>
                        <div className={styles.controlsList}>
                            <div>↑ - ROTATE</div>
                            <div>← → - MOVE</div>
                            <div>↓ - SOFT DROP</div>
                            <div>SPACE - HARD DROP</div>
                            <div>P - PAUSE/RESUME</div>
                            <div>R - RESTART</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.gameControls}>
                <button
                    className={`${styles.gameButton} ${paused ? styles.resume : styles.pause}`}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleButtonClick(e, togglePause)}
                >
                    {paused ? 'RESUME' : 'PAUSE'}
                </button>

                <button
                    className={styles.gameButton}
                    onClick={onExit}
                >
                    EXIT
                </button>
            </div>
        </div>
    );
};

export default Tetris;