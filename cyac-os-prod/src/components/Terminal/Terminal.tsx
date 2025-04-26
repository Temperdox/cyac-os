import React, { useState, useRef, useEffect } from 'react';
import styles from './Terminal.module.css';
import { FocusManager } from '../../services/FocusManager';
import { FileSystem } from '../../services/FileSystem';
/*import { CommandProcessor } from '../services/CommandProcessor';*/

interface TerminalProps {
    initialHeight?: number;
    allowResize?: boolean;
    onCommand?: (command: string) => void;
    username?: string;
}

const Terminal: React.FC<TerminalProps> = ({
                                               initialHeight = 250,
                                               allowResize = true,
                                               onCommand,
                                               username = 'guest',
                                           }) => {
    // State
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState<string[]>(['Welcome to CyberAcme Terminal v3.6.0', 'Type "help" for a list of commands']);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentPath] = useState('/home/user');
    const [terminalHeight, setTerminalHeight] = useState(initialHeight);
    const [isResizing, setIsResizing] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showCompletions, setShowCompletions] = useState(false);
    const [completions, setCompletions] = useState<string[]>([]);
    const [selectedCompletion, setSelectedCompletion] = useState(0);

    // Refs
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const resizeStartRef = useRef({ y: 0, height: initialHeight });
    const tempInputRef = useRef('');

    // Auto-scroll to bottom when history changes
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [history]);

    // Focus management
    const focusTerminal = () => {
        inputRef.current?.focus();
        setIsFocused(true);
        FocusManager.setFocus('terminal');
    };

    useEffect(() => {
        // Initialize focus manager
        FocusManager.initialize();

        // Add focus change listener
        const listenerId = 'terminal-component';
        FocusManager.addListener(listenerId, (focusId) => {
            setIsFocused(focusId === 'terminal');
        });

        // Focus the terminal initially
        setTimeout(focusTerminal, 100);

        return () => {
            FocusManager.removeListener(listenerId);
        };
    }, []);

    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // Check if click is inside the terminal
            if (terminalRef.current && terminalRef.current.contains(e.target as Node)) {
                focusTerminal();
            }
        };

        document.addEventListener('click', handleGlobalClick);

        // Clean up
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    // Terminal resize handler
    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsResizing(true);
        resizeStartRef.current = {
            y: e.clientY,
            height: terminalHeight
        };

        // Ensure terminal has focus during resize
        focusTerminal();
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = resizeStartRef.current.y - e.clientY;
            const newHeight = Math.max(150, resizeStartRef.current.height + deltaY);
            setTerminalHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Command submission
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!inputValue.trim()) return;

        const command = inputValue.trim();
        const prompt = `${username.toLowerCase()}@cyac:${currentPath}$ ${command}`;

        // Add command to terminal history
        setHistory(prev => [...prev, prompt]);

        // Add command to command history
        setCommandHistory(prev => [...prev, command]);

        // Reset history navigation
        setHistoryIndex(-1);

        // Execute command
        if (onCommand) {
            onCommand(command);
        }

        // Clear input
        setInputValue('');
        setShowCompletions(false);
    };

    // Command history navigation
    const navigateCommandHistory = (direction: 'up' | 'down') => {
        if (commandHistory.length === 0) return;

        if (direction === 'up') {
            // Save current input before navigating up
            if (historyIndex === -1) {
                tempInputRef.current = inputValue;
            }

            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
        } else {
            const newIndex = Math.max(historyIndex - 1, -1);
            setHistoryIndex(newIndex);

            if (newIndex === -1) {
                // Restore saved input
                setInputValue(tempInputRef.current);
            } else {
                setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        }
    };

    // Tab completion
    const handleTabCompletion = () => {
        const inputParts = inputValue.split(' ');
        const lastPart = inputParts[inputParts.length - 1];

        // Skip empty completions
        if (!lastPart) return;

        let completions: string[] = [];

        // Determine if we're completing a command or a path
        if (inputParts.length === 1) {
            // Command completion
            const commands = [
                'ls', 'cd', 'cat', 'pwd', 'echo', 'clear', 'help', 'home', 'exit'
            ];

            completions = commands.filter(cmd =>
                cmd.toLowerCase().startsWith(lastPart.toLowerCase())
            );
        } else {
            // Path completion
            try {
                completions = FileSystem.getCompletions(lastPart, currentPath);
            } catch (error) {
                console.error('Path completion error:', error);
                completions = [];
            }
        }

        if (completions.length === 0) return;

        if (completions.length === 1) {
            // If there's only one completion, use it
            inputParts[inputParts.length - 1] = completions[0];
            setInputValue(inputParts.join(' '));
            setShowCompletions(false);
        } else {
            // Show multiple completions
            setCompletions(completions);
            setShowCompletions(true);
            setSelectedCompletion(0);
        }
    };

    // Apply completion
    const applyCompletion = (completion: string) => {
        const inputParts = inputValue.split(' ');
        inputParts[inputParts.length - 1] = completion;
        setInputValue(inputParts.join(' '));
        setShowCompletions(false);
        inputRef.current?.focus();
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle keyboard events only when terminal has focus
        if (!isFocused) return;

        // Stop event propagation to prevent conflicts with global handlers
        e.stopPropagation();

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (showCompletions) {
                    setSelectedCompletion(prev =>
                        prev > 0 ? prev - 1 : completions.length - 1);
                } else {
                    navigateCommandHistory('up');
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (showCompletions) {
                    setSelectedCompletion(prev =>
                        prev < completions.length - 1 ? prev + 1 : 0);
                } else {
                    navigateCommandHistory('down');
                }
                break;

            case 'Tab':
                e.preventDefault();
                handleTabCompletion();
                break;

            case 'Enter':
                if (showCompletions) {
                    e.preventDefault();
                    applyCompletion(completions[selectedCompletion]);
                } else {
                    handleSubmit(e);
                }
                break;

            case 'Escape':
                if (showCompletions) {
                    e.preventDefault();
                    setShowCompletions(false);
                }
                break;
        }
    };

    // Parse terminal output for styling
    const parseOutputLine = (line: string) => {
        // Simple ansi-like color tag parsing
        const colorPattern = /\[(r|g|b|y|c|w)\](.*?)\[\/\1\]/g;

        if (!line.includes('[')) {
            return <span>{line}</span>;
        }

        // Replace color tags with appropriate spans
        const parts = [];
        let lastIndex = 0;
        let match;
        let key = 0;

        // Map of color codes to CSS module class names
        const colorClasses: Record<string, string> = {
            r: styles.red,
            g: styles.green,
            b: styles.blue,
            y: styles.yellow,
            c: styles.cyan,
            w: styles.white,
        };

        while ((match = colorPattern.exec(line)) !== null) {
            const [fullMatch, color, text] = match;
            const colorClass = colorClasses[color] || '';

            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(
                    <span key={key++}>
            {line.substring(lastIndex, match.index)}
          </span>
                );
            }

            // Add colored text
            parts.push(
                <span key={key++} className={colorClass}>
          {text}
        </span>
            );

            lastIndex = match.index + fullMatch.length;
        }

        // Add any remaining text
        if (lastIndex < line.length) {
            parts.push(
                <span key={key++}>
          {line.substring(lastIndex)}
        </span>
            );
        }

        return parts.length ? parts : <span>{line}</span>;
    };

    return (
        <div
            className={`${styles.terminal} ${isFocused ? styles.focused : ''} ${isResizing ? styles.resizing : ''}`}
            ref={terminalRef}
            style={{ height: `${terminalHeight}px` }}
            onClick={focusTerminal}
        >
            {/* Terminal Header with resize handle */}
            {allowResize && (
                <div
                    className={styles.resizeHandle}
                    onMouseDown={handleResizeStart}
                />
            )}

            {/* Terminal Output */}
            <div className={styles.output} ref={outputRef}>
                {history.map((line, index) => (
                    <div key={index} className={styles.line}>
                        {parseOutputLine(line)}
                    </div>
                ))}
            </div>

            {/* Terminal Input */}
            <form className={styles.inputLine} onSubmit={handleSubmit}>
                <span className={styles.prompt}>{username.toLowerCase()}@cyac:{currentPath}$</span>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        // Close completions when input changes
                        setShowCompletions(false);
                    }}
                    onKeyDown={handleKeyDown}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
            </form>

            {/* Tab Completions Menu */}
            {showCompletions && completions.length > 0 && (
                <div className={styles.completions}>
                    {completions.map((item, index) => (
                        <div
                            key={index}
                            className={`${styles.completionItem} ${index === selectedCompletion ? styles.selected : ''}`}
                            onClick={() => applyCompletion(item)}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Focus indicator - only shown when not focused */}
            {!isFocused && (
                <div
                    className={styles.focusIndicator}
                    onClick={focusTerminal}
                >
                    Click to activate terminal
                </div>
            )}
        </div>
    );
};

export default Terminal;