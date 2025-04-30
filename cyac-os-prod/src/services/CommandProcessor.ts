import { FileSystem } from './FileSystem';
import { AuthService } from './AuthService';
import { DiscordAuthService } from './DiscordAuthService';

// Command result interface
interface CommandResult {
    output: string[];    // Output lines
    newPath?: string;    // New path if changed
    program?: {          // Program to launch
        id: string;
        title: string;
        component: string;
        type: 'window' | 'fullscreen';  // Display type
    };
    success: boolean;    // Whether command was successful
}

// Available commands
const AVAILABLE_COMMANDS = [
    'ls', 'cd', 'cat', 'pwd', 'echo', 'clear', 'help', 'home', 'exit',
    'mkdir', 'touch', 'rm', 'login', 'logout', 'whoami'
];

/**
 * Command Processor Service
 * Handles processing and execution of terminal commands
 */
export class CommandProcessor {
    /**
     * Process a command and return the results
     * @param commandLine The full command line to process
     * @param currentPath Current directory path
     * @returns Command execution result
     */
    public static async processCommand(commandLine: string, currentPath: string): Promise<CommandResult> {
        // Default result
        const result: CommandResult = {
            output: [],
            success: true
        };

        try {
            // Split command into parts (handle quoted arguments)
            const parts = this.parseCommandLine(commandLine);
            if (parts.length === 0) {
                return result; // Empty command, return empty result
            }

            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            // Process based on command
            switch (command) {
                case 'ls':
                    this.executeLS(args, currentPath, result);
                    break;

                case 'cd':
                    this.executeCD(args, currentPath, result);
                    break;

                case 'cat':
                    this.executeCAT(args, currentPath, result);
                    break;

                case 'pwd':
                    result.output.push(currentPath);
                    break;

                case 'echo':
                    result.output.push(args.join(' '));
                    break;

                case 'clear':
                    // Clear is handled by the Terminal component
                    break;

                case 'help':
                    this.executeHelp(args, result);
                    break;

                case 'home':
                    result.output.push('[g]Returning to home screen[/g]');
                    // The actual home action is handled by the app component
                    break;

                case 'exit':
                    if (args[0] === 'fullscreen') {
                        result.output.push('[g]Exiting fullscreen mode[/g]');
                    } else {
                        result.output.push('[g]Exit command received. Close the browser tab to exit.[/g]');
                    }
                    break;

                case 'mkdir':
                    this.executeMkdir(args, currentPath, result);
                    break;

                case 'touch':
                    this.executeTouch(args, currentPath, result);
                    break;

                case 'rm':
                    this.executeRm(args, currentPath, result);
                    break;

                case 'login':
                    // Call executeLogin with fixed signature
                    const loginResult = await this.executeLogin(args);
                    result.output = loginResult.output;
                    result.success = loginResult.success;
                    break;

                case 'logout':
                    this.executeLogout(result);
                    break;

                case 'whoami':
                    this.executeWhoami(result);
                    break;

                default:
                    // Check if it's a program/app launcher
                    if (this.isProgramCommand(command, currentPath)) {
                        this.executeProgramLaunch(command, currentPath, result);
                    } else {
                        result.output.push(`[r]Command not found: ${command}[/r]`);
                        result.success = false;
                    }
            }

            return result;
        } catch (error) {
            result.output.push(`[r]Error: ${(error as Error).message}[/r]`);
            result.success = false;
            return result;
        }
    }

    /**
     * Parse command line into arguments, handling quoted strings
     * @param commandLine Full command line
     * @returns Array of command and arguments
     */
    private static parseCommandLine(commandLine: string): string[] {
        const parts: string[] = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < commandLine.length; i++) {
            const char = commandLine[i];

            if ((char === '"' || char === "'") && (i === 0 || commandLine[i-1] !== '\\')) {
                if (!inQuote) {
                    // Start quote
                    inQuote = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    // End quote
                    inQuote = false;
                    quoteChar = '';
                } else {
                    // Different quote inside a quote, treat as literal
                    current += char;
                }
            } else if (char === ' ' && !inQuote) {
                // Space outside quotes = delimiter
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                // Regular character
                current += char;
            }
        }

        // Add the last part
        if (current) {
            parts.push(current);
        }

        return parts;
    }

    /**
     * Execute the ls command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeLS(args: string[], currentPath: string, result: CommandResult): void {
        try {
            // Determine target directory
            const targetDir = args.length > 0
                ? FileSystem.resolvePath(args[0], currentPath)
                : currentPath;

            // Get directory contents
            const contents = FileSystem.listDirectory(targetDir);

            // Group by type
            const directories: string[] = [];
            const files: string[] = [];
            const programs: string[] = [];

            for (const item of contents) {
                if (item.type === 'directory') {
                    directories.push(`${item.name}/`);
                } else if (item.type === 'file') {
                    files.push(item.name);
                } else if (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') {
                    programs.push(`${item.name}${item.description ? ` - ${item.description}` : ''}`);
                }
            }

            // Format output
            if (directories.length > 0) {
                result.output.push(`[g]Directories:[/g] ${directories.join(' ')}`);
            }

            if (files.length > 0) {
                result.output.push(`[y]Files:[/y] ${files.join(' ')}`);
            }

            if (programs.length > 0) {
                result.output.push(`[c]Programs:[/c] ${programs.join(' ')}`);
            }

            if (contents.length === 0) {
                result.output.push('Directory is empty');
            }
        } catch (error) {
            result.output.push(`[r]Error: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the cd command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeCD(args: string[], currentPath: string, result: CommandResult): void {
        if (args.length === 0) {
            // No arguments, print current path
            result.output.push(currentPath);
            return;
        }

        try {
            // Resolve target path
            const targetPath = FileSystem.resolvePath(args[0], currentPath);

            // Check if path exists and is a directory
            if (!FileSystem.exists(targetPath)) {
                result.output.push(`[r]cd: No such directory: ${args[0]}[/r]`);
                result.success = false;
                return;
            }

            const itemType = FileSystem.getPathType(targetPath);
            if (itemType !== 'directory') {
                result.output.push(`[r]cd: Not a directory: ${args[0]}[/r]`);
                result.success = false;
                return;
            }

            // Update path
            result.newPath = targetPath;
        } catch (error) {
            result.output.push(`[r]cd: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the cat command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeCAT(args: string[], currentPath: string, result: CommandResult): void {
        if (args.length === 0) {
            result.output.push('[r]cat: Missing file argument[/r]');
            result.success = false;
            return;
        }

        try {
            // Resolve target path
            const targetPath = FileSystem.resolvePath(args[0], currentPath);

            // Check if path exists
            if (!FileSystem.exists(targetPath)) {
                result.output.push(`[r]cat: No such file: ${args[0]}[/r]`);
                result.success = false;
                return;
            }

            const itemType = FileSystem.getPathType(targetPath);

            if (itemType === 'file') {
                // Get the file item to access all properties
                const item = FileSystem.getItem(targetPath);

                // Check if it has a component path - this is the key condition
                if (item.component) {
                    // This is a special file that should be opened in the TextViewer
                    result.output.push(`[g]Opening ${item.name} in Text Viewer...[/g]`);

                    // If the file has a direct component path, use it
                    result.program = {
                        id: `textviewer_${item.name}`,
                        title: item.description || item.name,
                        component: item.component,
                        type: 'window'
                    };
                } else {
                    // Get file content for regular files
                    const content = FileSystem.getFileContent(targetPath);

                    // Check if the content itself indicates a component file
                    if (content.startsWith('[COMPONENT_FILE:')) {
                        // Extract component path from content
                        const componentPath = content.match(/\[COMPONENT_FILE:(.*?)\]/)?.[1] || '';

                        // Launch TextViewer for component files
                        result.output.push(`[g]Opening ${item.name} in Text Viewer...[/g]`);

                        result.program = {
                            id: `textviewer_${item.name}`,
                            title: item.description || item.name,
                            component: componentPath,
                            type: 'window'
                        };
                    } else {
                        // Display regular file content
                        const lines = content.split('\n');
                        result.output.push(...lines);
                    }
                }
            } else if (itemType === 'program' || itemType === 'scene' || itemType === 'subscene') {
                // Launch program/app
                const item = FileSystem.getItem(targetPath);

                result.output.push(`[g]Launching: ${item.name}[/g]`);

                result.program = {
                    id: `${item.type}_${item.name}`,
                    title: item.description || item.name,
                    component: item.component || '',
                    type: 'window' // Default to window, could be overridden based on platform
                };
            } else {
                result.output.push(`[r]cat: ${args[0]} is a directory[/r]`);
                result.success = false;
            }
        } catch (error) {
            result.output.push(`[r]cat: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the help command
     * @param args Command arguments
     * @param result Command result to modify
     */
    private static executeHelp(args: string[], result: CommandResult): void {
        if (args.length > 0) {
            // Help for specific command
            const command = args[0].toLowerCase();
            if (AVAILABLE_COMMANDS.includes(command)) {
                switch (command) {
                    case 'ls':
                        result.output = [
                            '[g]ls[/g] - List directory contents',
                            'Usage: ls [directory]',
                            'Example: ls /home/user/programs'
                        ];
                        break;

                    case 'cd':
                        result.output = [
                            '[g]cd[/g] - Change directory',
                            'Usage: cd [directory]',
                            'Examples:',
                            '  cd /home/user',
                            '  cd ..',
                            '  cd programs/games'
                        ];
                        break;

                    case 'cat':
                        result.output = [
                            '[g]cat[/g] - Display file contents or launch programs',
                            'Usage: cat [file or program]',
                            'Examples:',
                            '  cat readme.txt',
                            '  cat programs/browser/CyAc_browser_v1'
                        ];
                        break;

                    case 'pwd':
                        result.output = [
                            '[g]pwd[/g] - Print working directory',
                            'Usage: pwd',
                            'Displays the current directory path'
                        ];
                        break;

                    case 'echo':
                        result.output = [
                            '[g]echo[/g] - Display a line of text',
                            'Usage: echo [text]',
                            'Example: echo Hello, CyberAcme!'
                        ];
                        break;

                    case 'clear':
                        result.output = [
                            '[g]clear[/g] - Clear the terminal screen',
                            'Usage: clear'
                        ];
                        break;

                    case 'help':
                        result.output = [
                            '[g]help[/g] - Display help information',
                            'Usage: help [command]',
                            'Example: help ls'
                        ];
                        break;

                    case 'home':
                        result.output = [
                            '[g]home[/g] - Return to home screen',
                            'Usage: home',
                            'Closes all open windows and returns to the main interface'
                        ];
                        break;

                    case 'exit':
                        result.output = [
                            '[g]exit[/g] - Exit fullscreen mode or application',
                            'Usage: exit [fullscreen]',
                            'Use "exit fullscreen" to exit fullscreen mode on mobile'
                        ];
                        break;

                    // Add more commands as needed

                    default:
                        result.output = [`Help for ${command}`];
                }
            } else {
                result.output = [`[r]No help available for: ${args[0]}[/r]`];
                result.success = false;
            }
        } else {
            // General help
            result.output = [
                '[g]CYBERACME OS - AVAILABLE COMMANDS[/g]',
                '----------------------------------------',
                'ls          - List directory contents',
                'cd          - Change directory',
                'cat         - View file contents or launch programs',
                'pwd         - Print working directory',
                'echo        - Display a line of text',
                'clear       - Clear the terminal screen',
                'help        - Display this help information',
                'home        - Return to home screen',
                'exit        - Exit fullscreen mode or application',
                'mkdir       - Create a new directory',
                'touch       - Create a new file',
                'rm          - Remove a file or directory',
                'login       - Log in to the system',
                'logout      - Log out of the system',
                'whoami      - Display current user information',
                '----------------------------------------',
                'Type "help [command]" for more information on a specific command.',
                'Programs can be launched using the cat command.',
                'Example: cat programs/browser/CyAc_browser_v1'
            ];
        }
    }

    /**
     * Execute the mkdir command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeMkdir(args: string[], _currentPath: string, result: CommandResult): void {
        if (args.length === 0) {
            result.output.push('[r]mkdir: Missing directory name[/r]');
            result.success = false;
            return;
        }

        try {
            // Check if user is authorized for write operations
            if (!AuthService.isAuthenticated()) {
                result.output.push('[r]mkdir: Permission denied. Please login first.[/r]');
                result.success = false;
                return;
            }

            result.output.push(`[g]mkdir: Created directory ${args[0]}[/g]`);
        } catch (error) {
            result.output.push(`[r]mkdir: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the touch command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeTouch(args: string[], _currentPath: string, result: CommandResult): void {
        if (args.length === 0) {
            result.output.push('[r]touch: Missing file name[/r]');
            result.success = false;
            return;
        }

        try {
            // Check if user is authorized for write operations
            if (!AuthService.isAuthenticated()) {
                result.output.push('[r]touch: Permission denied. Please login first.[/r]');
                result.success = false;
                return;
            }

            result.output.push(`[g]touch: Created file ${args[0]}[/g]`);
        } catch (error) {
            result.output.push(`[r]touch: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the rm command
     * @param args Command arguments
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeRm(args: string[], _currentPath: string, result: CommandResult): void {
        if (args.length === 0) {
            result.output.push('[r]rm: Missing file or directory name[/r]');
            result.success = false;
            return;
        }

        try {
            // Check if user is authorized for write operations
            if (!AuthService.isAuthenticated()) {
                result.output.push('[r]rm: Permission denied. Please login first.[/r]');
                result.success = false;
                return;
            }

            // Does not actually function
            result.output.push(`[g]rm: Removed ${args[0]}[/g]`);
        } catch (error) {
            result.output.push(`[r]rm: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the login command
     * @param args Command arguments
     * @returns Command result
     */
    private static async executeLogin(args: string[]): Promise<CommandResult> {
        // Check if already logged in
        if (await DiscordAuthService.isAuthenticated()) {
            const user = DiscordAuthService.getCurrentUser();
            return {
                output: [`[g]Already logged in as ${user?.username || 'User'}![/g]`],
                success: true
            };
        }

        // Default to Discord login if no arguments or explicitly specified
        if (args.length === 0 || args[0].toLowerCase() === 'discord') {
            // Initiate Discord login flow
            DiscordAuthService.login();

            return {
                output: [
                    '[g]Initiating Discord authentication...[/g]',
                    'You will be redirected to Discord to authenticate.',
                    'After authentication, you will be returned to the terminal.'
                ],
                success: true
            };
        } else {
            // Only Discord login is supported
            return {
                output: [
                    '[r]Unknown login method:[/r] ' + args[0],
                    'Currently only Discord authentication is supported.',
                    'Type "[g]login discord[/g]" or just "[g]login[/g]" to authenticate with Discord.'
                ],
                success: false
            };
        }
    }

    /**
     * Execute the logout command
     * @param result Command result to modify
     */
    private static executeLogout(result: CommandResult): void {
        try {
            const logoutResult = AuthService.logout();

            if (logoutResult.success) {
                result.output.push('[g]Logout successful.[/g]');
            } else {
                result.output.push('[y]Not logged in.[/y]');
            }
        } catch (error) {
            result.output.push(`[r]logout: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Execute the whoami command
     * @param result Command result to modify
     */
    private static executeWhoami(result: CommandResult): void {
        try {
            const user = AuthService.getCurrentUser();

            if (user) {
                result.output.push(`[g]Username:[/g] ${user.username}`);
                result.output.push(`[g]Access level:[/g] ${user.accessLevel}`);
                result.output.push(`[g]Logged in since:[/g] ${user.loginTime}`);
            } else {
                result.output.push('[y]Not logged in. Running as guest.[/y]');
            }
        } catch (error) {
            result.output.push(`[r]whoami: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Check if a command is a program/app launcher
     * @param command Command to check
     * @param currentPath Current directory path
     * @returns Whether the command is a program launcher
     */
    private static isProgramCommand(command: string, currentPath: string): boolean {
        try {
            // Check current directory
            const items = FileSystem.listDirectory(currentPath);
            const programItem = items.find(item =>
                (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') &&
                item.name.toLowerCase() === command.toLowerCase()
            );

            if (programItem) {
                return true;
            }

            // Check programs directory for shortcuts
            const programsPath = '/home/user/programs';
            if (FileSystem.exists(programsPath)) {
                const findProgram = (dirPath: string): boolean => {
                    const dirItems = FileSystem.listDirectory(dirPath);

                    // Check direct items
                    const directProgram = dirItems.find(item =>
                        (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') &&
                        item.name.toLowerCase() === command.toLowerCase()
                    );

                    if (directProgram) {
                        return true;
                    }

                    // Recursively check subdirectories
                    for (const item of dirItems) {
                        if (item.type === 'directory') {
                            const subDirPath = `${dirPath}/${item.name}`;
                            if (findProgram(subDirPath)) {
                                return true;
                            }
                        }
                    }

                    return false;
                };

                return findProgram(programsPath);
            }

            return false;
        } catch (error) {
            console.error('Error in isProgramCommand:', error);
            return false;
        }
    }

    /**
     * Execute a program launch command
     * @param command Program name to launch
     * @param currentPath Current directory path
     * @param result Command result to modify
     */
    private static executeProgramLaunch(command: string, currentPath: string, result: CommandResult): void {
        try {
            // First check current directory
            let programItem;
            let programPath;

            try {
                const items = FileSystem.listDirectory(currentPath);
                programItem = items.find(item =>
                    (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') &&
                    item.name.toLowerCase() === command.toLowerCase()
                );

                if (programItem) {
                    programPath = `${currentPath}/${programItem.name}`;
                }
            } catch (error) {
                console.error('Error checking current directory:', error);
            }

            // If not found in current directory, search programs directory recursively
            if (!programItem) {
                const programsPath = '/home/user/programs';
                if (FileSystem.exists(programsPath)) {
                    const findProgram = (dirPath: string): { item: FileSystemItem, path: string } | null => {
                        try {
                            const dirItems = FileSystem.listDirectory(dirPath);

                            // Check direct items
                            const directProgram = dirItems.find(item =>
                                (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') &&
                                item.name.toLowerCase() === command.toLowerCase()
                            );

                            if (directProgram) {
                                return { item: directProgram, path: `${dirPath}/${directProgram.name}` };
                            }

                            // Recursively check subdirectories
                            for (const item of dirItems) {
                                if (item.type === 'directory') {
                                    const subDirPath = `${dirPath}/${item.name}`;
                                    const found = findProgram(subDirPath);
                                    if (found) {
                                        return found;
                                    }
                                }
                            }

                            return null;
                        } catch (error) {
                            console.error(`Error searching directory ${dirPath}:`, error);
                            return null;
                        }
                    };

                    const found = findProgram(programsPath);
                    if (found) {
                        programItem = found.item;
                        programPath = found.path;
                    }
                }
            }

            if (programItem && programPath) {
                result.output.push(`[g]Launching: ${programItem.name}${programItem.description ? ` - ${programItem.description}` : ''}[/g]`);

                // Check if the program requires authentication
                if (programItem.restricted && !AuthService.isAuthenticated()) {
                    result.output.push('[r]Access denied: This program requires authentication.[/r]');
                    result.output.push('Use "login [username]" to authenticate.');
                    result.success = false;
                    return;
                }

                // Create program launch info
                result.program = {
                    id: `${programItem.type}_${programItem.name}`,
                    title: programItem.description || programItem.name,
                    component: programItem.component || '',
                    type: 'window' // Default to window, could be overridden based on platform
                };
            } else {
                result.output.push(`[r]Program not found: ${command}[/r]`);
                result.success = false;
            }
        } catch (error) {
            result.output.push(`[r]Error launching program: ${(error as Error).message}[/r]`);
            result.success = false;
        }
    }

    /**
     * Get command completions for tab completion
     * @param partial Partial command to complete
     * @returns Array of possible command completions
     */
    public static getCommandCompletions(partial: string): string[] {
        return AVAILABLE_COMMANDS.filter(cmd =>
            cmd.startsWith(partial.toLowerCase())
        );
    }
}

// Required for TypeScript - will be used when FileSystem is updated
interface FileSystemItem {
    name: string;
    type: string;
    content?: string;
    component?: string;
    description?: string;
    restricted?: boolean;
}