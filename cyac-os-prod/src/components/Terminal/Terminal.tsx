import React, { useState, useRef, useEffect } from 'react';
import styles from './Terminal.module.css';
import { FocusManager } from '../../services/FocusManager';
import { CommandProcessor } from '../../services/CommandProcessor';
import { FileSystem } from '../../services/FileSystem';
import TerminalHelper from './TerminalHelper';

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

    const helperTips = [
        "Use UP/DOWN arrows to navigate command history",
        "Press TAB to autocomplete commands and paths",
        "Type 'ls' to list files and directories",
        "Type 'help' for a list of all available commands",
        "Use 'cat [filename]' to view file contents",
        "Try 'cd' to change directories"
    ];

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

    /**
     * Handle program launch request from command processor
     * @param program Program launch information
     */
    const handleProgramLaunch = (program: {
        id: string;
        title: string;
        component: string;
        type: 'window' | 'fullscreen';
    }) => {
        // Check if onCommand prop exists and call it with program info
        if (onCommand) {
            // For text files with component paths, special handling ensures they open with the correct viewer
            if (program.id.startsWith('textviewer_')) {
                // Pass through the onCommand prop with all necessary information
                onCommand({
                    id: program.id,
                    title: program.title,
                    component: program.component,
                    type: program.type
                });
            } else {
                // Regular program launch
                onCommand(program);
            }
        } else {
            console.warn('Terminal: onCommand prop not provided, cannot launch program:', program);
        }
    };

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

            // Add command output to terminal directly - no need for formatDirectoryListing
            if (result.output && result.output.length > 0) {
                setHistory(prev => [...prev, ...result.output]);
            }

            // Update path if changed (e.g., from cd command)
            if (result.newPath) {
                setCurrentPath(result.newPath);
            }

            // Handle program launch if needed
            if (result.program) {
                handleProgramLaunch(result.program);
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

    // Handle click on a terminal item
    const handleItemClick = (item: string, itemType: string) => {
        let command = '';

        // If it's a directory, cd to it
        if (itemType === 'directory') {
            // Remove trailing slash if present
            const dirName = item.endsWith('/') ? item.slice(0, -1) : item;
            command = `cd ${dirName}`;
        }
        // If it's a file, cat it
        else if (itemType === 'file') {
            command = `cat ${item}`;
        }
        // If it's a program, run it directly (don't cd into it)
        else if (itemType === 'program') {
            // For programs, we need to extract just the program name without description
            // Format might be "program - description"
            const programName = item.split(' - ')[0].trim();
            command = programName;
        }

        if (command) {
            // Execute command directly without showing in input
            // Add command to terminal history with prompt
            const prompt = `${username.toLowerCase()}@cyac:${currentPath}$ ${command}`;
            setHistory(prev => [...prev, prompt]);

            // Add command to command history for up/down navigation
            setCommandHistory(prev => [...prev, command]);

            // Process command
            processCommand(command);
        }
    };

    // Parse terminal output for styling with clickable items
    const parseOutputLine = (line: string) => {
        // Special handling for lines with directory/file/program listings
        if (line.includes('[g]Directories:[/g]') || line.includes('[y]Files:[/y]') ||
            line.includes('[c]Programs:[/c]')) {
            return parseDirectoryLine(line);
        }

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

    // Parse directory listing lines with clickable items based on actual CommandProcessor output format
    const parseDirectoryLine = (line: string) => {
        // Handle directory listings: "[g]Directories:[/g] dir1/ dir2/"
        if (line.includes('[g]Directories:[/g]')) {
            const parts = line.split('[g]Directories:[/g]');
            if (parts.length > 1) {
                const directories = parts[1].trim().split(' ');

                return (
                    <>
                        <span className={styles.green}>Directories:</span>
                        {' '}
                        {directories.map((dir, idx) => (
                            <span
                                key={idx}
                                className={`${styles.blue} ${styles.termCLick}`}
                                onClick={() => handleItemClick(dir, 'directory')}
                                style={{ cursor: 'pointer', marginRight: '12px' }}
                            >
                                {dir}
                            </span>
                        ))}
                    </>
                );
            }
        }

        // Handle file listings: "[y]Files:[/y] file1.txt file2.txt"
        else if (line.includes('[y]Files:[/y]')) {
            const parts = line.split('[y]Files:[/y]');
            if (parts.length > 1) {
                const files = parts[1].trim().split(' ');

                return (
                    <>
                        <span className={styles.yellow}>Files:</span>
                        {' '}
                        {files.map((file, idx) => (
                            <span
                                key={idx}
                                className={`${styles.blue} ${styles.termCLick}`}
                                onClick={() => handleItemClick(file, 'file')}
                                style={{ cursor: 'pointer', marginRight: '12px' }}
                            >
                                {file}
                            </span>
                        ))}
                    </>
                );
            }
        }

        // Handle program listings: "[c]Programs:[/c] program1 - description program2 - description"
        else if (line.includes('[c]Programs:[/c]')) {
            const parts = line.split('[c]Programs:[/c]');
            if (parts.length > 1) {
                // Programs might have descriptions with spaces, so we need to handle them carefully
                // The format is usually "program1 - description program2 - description"
                const programText = parts[1].trim();

                // Split by looking for the pattern of "word - "
                const programRegex = /\s*([^\s-]+(?:\s+[^\s-]+)*?)(?:\s+-\s+(.*?))?(?=\s+[^\s-]+\s+-|\s*$)/g;
                const programs = [];
                let match;

                while ((match = programRegex.exec(programText)) !== null) {
                    programs.push({
                        name: match[1].trim(),
                        description: match[2] ? match[2].trim() : ''
                    });
                }

                // If the regex didn't match any programs, fallback to simple space splitting
                const fallbackPrograms = programs.length > 0 ? programs :
                    programText.split(/\s+/).map(p => ({ name: p, description: '' }));

                return (
                    <>
                        <span className={styles.cyan}>Programs:</span>
                        {' '}
                        {fallbackPrograms.map((program, idx) => (
                            <span
                                className={`${styles.blue} ${styles.termCLick}`}
                                key={idx}
                                onClick={() => handleItemClick(program.name, 'program')}
                                style={{ cursor: 'pointer', marginRight: '12px' }}
                            >
                                {program.name}{program.description ? ` - ${program.description}` : ''}
                            </span>
                        ))}
                    </>
                );
            }
        }

        // Default case - just color parse the line
        return parseStandardLine(line);
    };

    // Helper function to parse standard lines with color tags
    const parseStandardLine = (line: string) => {
        const colorPattern = /\[(r|g|b|y|c|w)\](.*?)\[\/\1\]/g;

        if (!line.includes('[')) {
            return <span>{line}</span>;
        }

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        let key = 0;

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

            if (match.index > lastIndex) {
                parts.push(
                    <span key={key++}>
                        {line.substring(lastIndex, match.index)}
                    </span>
                );
            }

            parts.push(
                <span key={key++} className={colorClass}>
                    {text}
                </span>
            );

            lastIndex = match.index + fullMatch.length;
        }

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

            {/* Terminal Input - always at the bottom */}
            <form className={styles.inputLine} onSubmit={handleSubmit} ref={inputLineRef}>
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

                {/* Add helper gif component to terminal */}
                <div style={{position: 'absolute', right: '10px', bottom: '5px'}}>
                    <TerminalHelper
                        gifPath="/assets/images/cyac_assistant/final.gif"
                        tips={helperTips}
                    />
                </div>
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