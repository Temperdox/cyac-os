import React, { useState, useEffect } from 'react';
import styles from './TicTacToe.module.css';

// Define game metadata
export const gameMetadata = {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: 'Classic game of X and O. Get three in a row to win!',
    coverImage: '/game-covers/tic-tac-toe.png', // Will use placeholder if this doesn't exist
    developer: 'CyberAcme',
    releaseDate: '2025',
    collections: ['arcade', 'puzzle'],
    features: ['singleplayer', 'multiplayer', 'ai-opponent']
};

// Component props type
interface TicTacToeProps {
    onExit?: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onExit }) => {
    // Game state
    const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [aiOpponent, setAiOpponent] = useState(true);
    const [score, setScore] = useState({ x: 0, o: 0, tie: 0 });

    // Check for winner
    useEffect(() => {
        const calculatedWinner = calculateWinner(board);
        if (calculatedWinner) {
            setWinner(calculatedWinner);
            setGameOver(true);

            // Update score
            if (calculatedWinner === 'X') {
                setScore(prev => ({ ...prev, x: prev.x + 1 }));
            } else if (calculatedWinner === 'O') {
                setScore(prev => ({ ...prev, o: prev.o + 1 }));
            }
        } else if (!board.includes(null)) {
            // It's a tie if all squares are filled
            setGameOver(true);
            setScore(prev => ({ ...prev, tie: prev.tie + 1 }));
        }
    }, [board]);

    // AI move
    useEffect(() => {
        // If AI opponent is enabled, it's O's turn, and game isn't over
        if (aiOpponent && !isXNext && !gameOver) {
            // Add a slight delay to make it feel more natural
            const timeout = setTimeout(() => {
                makeAiMove();
            }, 500);

            return () => clearTimeout(timeout);
        }
    }, [isXNext, gameOver, aiOpponent]);

    // Handle square click
    const handleClick = (index: number) => {
        // Return if square is already filled or game is over
        if (board[index] || gameOver) return;

        // Update board
        const newBoard = [...board];
        newBoard[index] = isXNext ? 'X' : 'O';
        setBoard(newBoard);

        // Toggle player
        setIsXNext(!isXNext);
    };

    // AI move logic (simple)
    const makeAiMove = () => {
        // Create a copy of the board
        const newBoard = [...board];

        // Check for win or block
        const winMoveIndex = findWinningMove(newBoard, 'O');
        const blockMoveIndex = findWinningMove(newBoard, 'X');

        let moveIndex;

        if (winMoveIndex !== -1) {
            // Take winning move if available
            moveIndex = winMoveIndex;
        } else if (blockMoveIndex !== -1) {
            // Block opponent's winning move
            moveIndex = blockMoveIndex;
        } else if (newBoard[4] === null) {
            // Take center if available
            moveIndex = 4;
        } else {
            // Choose random available square
            const availableIndices = newBoard
                .map((square, index) => square === null ? index : -1)
                .filter(index => index !== -1);

            moveIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }

        // Make the move
        if (moveIndex !== undefined && moveIndex !== -1) {
            newBoard[moveIndex] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
        }
    };

    // Find winning move for the specified player
    const findWinningMove = (board: Array<string | null>, player: string): number => {
        // Check all possible winning combinations
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (const line of lines) {
            const [a, b, c] = line;
            const squares = [board[a], board[b], board[c]];
            const playerCount = squares.filter(square => square === player).length;
            const emptyCount = squares.filter(square => square === null).length;

            // If there are two of the player's symbols and one empty square
            if (playerCount === 2 && emptyCount === 1) {
                // Return the index of the empty square
                const emptyIndex = squares.indexOf(null);
                if (emptyIndex !== -1) {
                    return line[emptyIndex];
                }
            }
        }

        return -1;
    };

    // Calculate winner helper function
    const calculateWinner = (squares: Array<string | null>): string | null => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (const [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }

        return null;
    };

    // Reset game
    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
        setGameOver(false);
    };

    // Toggle AI opponent
    const toggleAiOpponent = () => {
        setAiOpponent(!aiOpponent);
        resetGame();
    };

    // Render square
    const renderSquare = (index: number) => {
        return (
            <button
                className={styles.square}
                onClick={() => handleClick(index)}
            >
                {board[index]}
            </button>
        );
    };

    // Get status message
    const getStatus = () => {
        if (winner) {
            return `Winner: ${winner}`;
        } else if (gameOver) {
            return "It's a tie!";
        } else {
            return `Next player: ${isXNext ? 'X' : 'O'}`;
        }
    };

    return (
        <div className={styles.game}>
            <div className={styles.gameHeader}>
                <h1 className={styles.title}>Tic Tac Toe</h1>
                <button className={styles.exitButton} onClick={onExit}>
                    Exit
                </button>
            </div>

            <div className={styles.gameInfo}>
                <div className={styles.status}>{getStatus()}</div>
                <div className={styles.scoreBoard}>
                    <div className={styles.scoreItem}>X: {score.x}</div>
                    <div className={styles.scoreItem}>O: {score.o}</div>
                    <div className={styles.scoreItem}>Ties: {score.tie}</div>
                </div>
            </div>

            <div className={styles.board}>
                <div className={styles.boardRow}>
                    {renderSquare(0)}
                    {renderSquare(1)}
                    {renderSquare(2)}
                </div>
                <div className={styles.boardRow}>
                    {renderSquare(3)}
                    {renderSquare(4)}
                    {renderSquare(5)}
                </div>
                <div className={styles.boardRow}>
                    {renderSquare(6)}
                    {renderSquare(7)}
                    {renderSquare(8)}
                </div>
            </div>

            <div className={styles.controls}>
                <button
                    className={styles.controlButton}
                    onClick={resetGame}
                >
                    New Game
                </button>
                <button
                    className={styles.controlButton}
                    onClick={toggleAiOpponent}
                >
                    {aiOpponent ? 'Play vs Human' : 'Play vs AI'}
                </button>
            </div>
        </div>
    );
};

export default TicTacToe;