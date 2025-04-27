import React, { useState, useRef, useEffect } from 'react';
import styles from './Terminal.module.css';
import { FocusManager } from '../../services/FocusManager';
import { CommandProcessor } from '../../services/CommandProcessor';
import { FileSystem } from '../../services/FileSystem';

interface TerminalProps {
    initialHeight?: number;
    onResize?: (newHeight: number) => void;
    allowResize?: boolean;
    username?: string;
    onCommand?: (program: {
        id: string;
        title: string;
        component: string;
        type: 'window' | 'fullscreen';
    }) => void;
}

const Terminal: React.FC<TerminalProps> = ({
                                               initialHeight = 250,
                                               onResize,
                                               allowResize = true,
                                               username = 'guest',
                                               onCommand,
                                           }) => {
    // State
    const [inputValue, setInputValue] = useState<string>('');
    const [history, setHistory] = useState<string[]>([
        'Welcome to CyberAcme Terminal v3.6.0',
        'Type "help" for a list of commands'
    ]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [currentPath, setCurrentPath] = useState<string>('/home/user');
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [showCompletions, setShowCompletions] = useState<boolean>(false);
    const [, setCompletionLeft] = useState<number>(0);
    const [completions, setCompletions] = useState<string[]>([]);
    const [selectedCompletion, setSelectedCompletion] = useState<number>(0);

    // Command categories for suggestions
    const pathCommands = ['cd', 'ls', 'mkdir', 'rm', 'rmdir'];
    const fileCommands = ['cat', 'touch', 'rm'];

    // Refs
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputLineRef = useRef<HTMLFormElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const resizeStartRef = useRef<{ y: number; height: number }>({ y: 0, height: initialHeight });
    const tempInputRef = useRef<string>('');

    // Auto-scroll to bottom when history changes
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [history]);

    // Focus management
    const focusTerminal = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        setIsFocused(true);
        FocusManager.setFocus('terminal');
    };

    // Measure caret position in command input for suggestion box start pos
    const updateCompletionPosition = () => {
        const inp = inputRef.current;
        const line = inputLineRef.current;
        if (!inp || !line) return;
        const pos = inp.selectionStart ?? 0;
        const text = inp.value.slice(0, pos);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const style = window.getComputedStyle(inp);
        ctx.font = style.font;
        const w = ctx.measureText(text).width;
        const inpRect = inp.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();
        setCompletionLeft(inpRect.left - lineRect.left + w);
    };

    useEffect(() => {
        // Add focus change listener
        const listenerId = 'terminal-component';
        FocusManager.addListener(listenerId, (focusId: string) => {
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

        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    // Terminal resize handler - for resizing from top
    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsResizing(true);
        if (onResize && initialHeight) {
            resizeStartRef.current = {
                y: e.clientY,
                height: initialHeight,
            };
        }

        // Ensure terminal has focus during resize
        focusTerminal();

        // Add a class to the body to prevent text selection during resize
        document.body.classList.add('resizing');
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            // For top resizing, the delta is inverted since we're pulling from the top
            const deltaY = resizeStartRef.current.y - e.clientY;

            // Calculate new height by adding the delta (moving up increases height)
            // Allow very small heights (as low as 60px)
            const newHeight = Math.max(60, resizeStartRef.current.height + deltaY);

            // Call the onResize callback if provided
            if (onResize) {
                onResize(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.classList.remove('resizing');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing');
        };
    }, [isResizing, onResize]);

    // Process command internally
    const processCommand = async (command: string) => {
        // Handle clear command directly
        if (command.trim().toLowerCase() === 'clear') {
            setHistory([]);
            return;
        }

        try {
            // Process command through CommandProcessor
            const result = await CommandProcessor.processCommand(command, currentPath);

            // Add command output to terminal
            if (result.output && result.output.length > 0) {
                setHistory(prev => [...prev, ...result.output]);
            }

            // Update path if changed (e.g., from cd command)
            if (result.newPath) {
                setCurrentPath(result.newPath);
            }

            // Pass program launch to parent if needed
            if (result.program && onCommand) {
                onCommand(result.program);
            }
        } catch (error) {
            // Handle any errors with command processing
            setHistory(prev => [...prev, `[r]Error: ${error instanceof Error ? error.message : 'Unknown error'}[/r]`]);
        }
    };

    // Command submission
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!inputValue.trim()) return;

        const command = inputValue.trim();
        const prompt = `${username.toLowerCase()}@cyac:${currentPath}$ ${command}`;

        // Add command prompt to terminal history
        setHistory(prev => [...prev, prompt]);

        // Add command to command history for up/down navigation
        setCommandHistory(prev => [...prev, command]);

        // Reset history navigation
        setHistoryIndex(-1);

        // Process command
        processCommand(command);

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

    // Tab completion handler
    const handleTabCompletion = () => {
        try {
            if (showCompletions) {
                setShowCompletions(false);
                return;
            }

            const raw = inputValue;

            // CASE 1: empty input ⇒ all commands
            if (!raw.trim()) {
                const all = CommandProcessor.getCommandCompletions('');
                setCompletions(all);
                updateCompletionPosition();
                setSelectedCompletion(0);
                setShowCompletions(true);
                return;
            }

            const parts = raw.split(' ');
            const cmd = parts[0].toLowerCase();

            // CASE 2: partial command
            if (parts.length === 1 && !raw.endsWith(' ')) {
                const opts = CommandProcessor.getCommandCompletions(cmd);
                if (opts.length === 1) {
                    setInputValue(opts[0] + ' ');
                } else if (opts.length > 1) {
                    setCompletions(opts);
                    updateCompletionPosition();
                    setSelectedCompletion(0);
                    setShowCompletions(true);
                }
                return;
            }

            // CASE 3: path/file completion
            if (parts.length > 1 && (pathCommands.includes(cmd) || fileCommands.includes(cmd))) {
                const last = parts[parts.length - 1];
                const sug = FileSystem.getCompletions(last, currentPath);
                if (sug.length === 1) {
                    parts[parts.length - 1] = sug[0];
                    setInputValue(parts.join(' '));
                } else if (sug.length > 1) {
                    setCompletions(sug);
                    updateCompletionPosition();
                    setSelectedCompletion(0);
                    setShowCompletions(true);
                }
            }
        } catch (err) {
            console.error('Tab completion error:', err);
        }
    };

    // Apply selected completion
    const applyCompletion = (completion: string) => {
        // If it's a command completion (no spaces in input yet)
        if (!inputValue.includes(' ')) {
            setInputValue(completion + ' ');
        } else {
            // It's a path completion
            const parts = inputValue.split(' ');
            parts[parts.length - 1] = completion;
            setInputValue(parts.join(' '));
        }

        setShowCompletions(false);
        inputRef.current?.focus();
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle keyboard events for command history and tab completion
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
        const parts: React.ReactNode[] = [];
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

    // Handle clicks on the focus indicator directly
    const handleFocusIndicatorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        focusTerminal();
    };

    return (
        <div
            className={`${styles.terminal} ${isFocused ? styles.focused : ''} ${isResizing ? styles.resizing : ''}`}
            ref={terminalRef}
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

             {/*Hints Bar (always visible on bottom of terminal)*/}
            {/*<div className={styles.hintBar}>
                <div className={styles.hint}>HINT: USE UP/DOWN ARROWS TO NAVIGATE COMMAND HISTORY</div>
                <div className={styles.hint}>HINT: SOME SCENES AND SUBSCENES REQUIRE AUTHENTICATION</div>
            </div>*/}

            {/* Terminal Input - always at the bottom */}
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
                    onClick={handleFocusIndicatorClick}
                >
                    CLICK HERE TO TYPE IN TERMINAL
                </div>
            )}
        </div>
    );
};

export default Terminal;