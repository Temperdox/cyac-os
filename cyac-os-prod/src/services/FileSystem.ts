/**
 * File System Service
 * Simulates a file system structure for the terminal and manages file operations
 */

// File system item types
type FileType = 'file' | 'directory' | 'program' | 'scene' | 'subscene';

// File system item interface
interface FileSystemItem {
    name: string;
    type: FileType;
    content?: string;
    children?: Record<string, FileSystemItem>;
    component?: string; // Path to component for programs, scenes, subscenes
    restricted?: boolean; // Whether item requires authentication
    description?: string; // Description of the item
}

// File system schema definition
interface FileSystemSchema {
    [key: string]: FileSystemItem;
}

export class FileSystem {
    // Root file system structure - will be populated dynamically
    private static fileSystem: FileSystemSchema = {
        '/': {
            name: '/',
            type: 'directory',
            children: {
                'home': {
                    name: 'home',
                    type: 'directory',
                    children: {
                        'user': {
                            name: 'user',
                            type: 'directory',
                            children: {
                                'documents': {
                                    name: 'documents',
                                    type: 'directory',
                                    children: {
                                        'readme.txt': {
                                            name: 'readme.txt',
                                            type: 'file',
                                            content: 'Welcome to CyberAcme OS v3.6.0\n\nThis terminal provides access to various resources and tools.\nType "help" for a list of available commands.\n\nCYBERACME CORPORATION - THE FUTURE IS OUR CODE'
                                        }
                                    }
                                },
                                'programs': {
                                    name: 'programs',
                                    type: 'directory',
                                    children: {
                                        'browser': {
                                            name: 'browser',
                                            type: 'directory',
                                            children: {
                                                'CyAc_browser_v1': {
                                                    name: 'CyAc_browser_v1',
                                                    type: 'program',
                                                    component: '/components/programs/browser/CyAc_browser_v1',
                                                    description: 'CyberAcme Web Browser v1.0'
                                                }
                                            }
                                        },
                                        'games': {
                                            name: 'games',
                                            type: 'directory',
                                            children: {
                                                'tetris': {
                                                    name: 'tetris',
                                                    type: 'program',
                                                    component: '/components/programs/games/Tetris',
                                                    description: 'Classic Tetris Game'
                                                },
                                                'snake': {
                                                    name: 'snake',
                                                    type: 'program',
                                                    component: '/components/programs/games/Snake',
                                                    description: 'Classic Snake Game'
                                                }
                                            }
                                        },
                                        'animations': {
                                            name: 'animations',
                                            type: 'directory',
                                            children: {
                                                'matrix': {
                                                    name: 'matrix',
                                                    type: 'program',
                                                    component: '/components/programs/animations/Matrix',
                                                    description: 'Matrix Code Animation'
                                                }
                                            }
                                        },
                                        'utilities': {
                                            name: 'utilities',
                                            type: 'directory',
                                            children: {
                                                'clock': {
                                                    name: 'clock',
                                                    type: 'program',
                                                    component: '/components/programs/utilities/Clock',
                                                    description: 'Digital Clock'
                                                },
                                                'calculator': {
                                                    name: 'calculator',
                                                    type: 'program',
                                                    component: '/components/programs/utilities/Calculator',
                                                    description: 'Simple Calculator'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                'sys': {
                    name: 'sys',
                    type: 'directory',
                    children: {
                        'config': {
                            name: 'config',
                            type: 'directory',
                            children: {
                                'system.conf': {
                                    name: 'system.conf',
                                    type: 'file',
                                    content: '# CyberAcme OS System Configuration\n\nHOSTNAME=cyac-terminal\nUSER=guest\nTERMINAL_COLOR=#33ff33\nSCREEN_EFFECTS=true\nAUDIO_ENABLED=true\nGPU_ACCELERATION=auto\n'
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    // Check if the file system has been initialized
    private static isInitialized = false;

    /**
     * Initialize the file system
     * This would scan the file structure in a real app
     */
    public static async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // In a real application, this would dynamically scan the file structure
            console.log('Initializing file system...');

            // For now, we're using the hardcoded structure
            // In a real app, you would scan the program directories

            this.isInitialized = true;
            console.log('File system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize file system:', error);
            throw new Error('File system initialization failed');
        }
    }

    /**
     * Get an item at a specific path
     * @param path File system path
     * @returns The file system item at the path
     */
    public static getItem(path: string): FileSystemItem {
        this.ensureInitialized();

        // Handle root directory
        if (path === '/') {
            return this.fileSystem['/'];
        }

        // Split path into segments
        const segments = path.split('/').filter(Boolean);
        let current = this.fileSystem['/'];

        // Traverse path
        for (const segment of segments) {
            if (!current.children || !current.children[segment]) {
                throw new Error(`Path not found: ${path}`);
            }

            current = current.children[segment];
        }

        return current;
    }

    /**
     * List directory contents
     * @param path Directory path
     * @returns Array of items in the directory
     */
    public static listDirectory(path: string): FileSystemItem[] {
        this.ensureInitialized();

        try {
            const item = this.getItem(path);

            if (item.type !== 'directory') {
                throw new Error(`Not a directory: ${path}`);
            }

            if (!item.children) {
                return [];
            }

            // Convert children object to array and add the name property
            return Object.values(item.children);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get file content
     * @param path File path
     * @returns File content as string
     */
    public static getFileContent(path: string): string {
        this.ensureInitialized();

        try {
            const item = this.getItem(path);

            if (item.type !== 'file') {
                throw new Error(`Not a file: ${path}`);
            }

            return item.content || '';
        } catch (error) {
            throw error;
        }
    }

    /**
     * Resolve a path (handles relative paths)
     * @param path Path to resolve
     * @param currentPath Current directory path
     * @returns Absolute path
     */
    public static resolvePath(path: string, currentPath: string): string {
        this.ensureInitialized();

        // Already absolute path
        if (path.startsWith('/')) {
            return this.normalizePath(path);
        }

        // Handle special cases
        if (path === '.') {
            return currentPath;
        }

        if (path === '..') {
            // Go up one directory
            const segments = currentPath.split('/').filter(Boolean);
            segments.pop();
            return '/' + segments.join('/');
        }

        // Relative path
        return this.normalizePath(`${currentPath}/${path}`);
    }

    /**
     * Normalize a path (remove redundant separators and handle . and ..)
     * @param path Path to normalize
     * @returns Normalized path
     */
    public static normalizePath(path: string): string {
        this.ensureInitialized();

        // Split path into segments
        const segments = path.split('/').filter(Boolean);
        const resultSegments: string[] = [];

        // Process each segment
        for (const segment of segments) {
            if (segment === '.') {
                // Current directory - skip
                continue;
            } else if (segment === '..') {
                // Parent directory - remove last segment
                if (resultSegments.length > 0) {
                    resultSegments.pop();
                }
            } else {
                // Regular segment - add to result
                resultSegments.push(segment);
            }
        }

        // Return normalized path with leading slash
        return '/' + resultSegments.join('/');
    }

    /**
     * Get parent directory
     * @param path Path to get parent of
     * @returns Parent directory path
     */
    public static getParentDirectory(path: string): string {
        this.ensureInitialized();

        if (path === '/') {
            return '/';
        }

        const segments = path.split('/').filter(Boolean);
        segments.pop();
        return '/' + segments.join('/');
    }

    /**
     * Check if a path exists
     * @param path Path to check
     * @returns Whether the path exists
     */
    public static exists(path: string): boolean {
        this.ensureInitialized();

        try {
            this.getItem(path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get path type
     * @param path Path to check
     * @returns Type of the item at the path
     */
    public static getPathType(path: string): FileType {
        this.ensureInitialized();

        try {
            const item = this.getItem(path);
            return item.type;
        } catch {
            throw new Error(`Path not found: ${path}`);
        }
    }

    /**
     * Get path completions for tab completion
     * @param partial Partial path to complete
     * @param currentPath Current directory path
     * @returns Array of possible completions
     */
    public static getCompletions(partial: string, currentPath: string): string[] {
        this.ensureInitialized();

        try {
            let dirPath: string;
            let prefix: string;

            // Determine if the partial path includes a directory component
            if (partial.includes('/')) {
                // If it has a slash, split into directory and name prefix
                const lastSlashIndex = partial.lastIndexOf('/');
                dirPath = partial.substring(0, lastSlashIndex);
                prefix = partial.substring(lastSlashIndex + 1);

                // Resolve directory path
                dirPath = this.resolvePath(dirPath, currentPath);
            } else {
                // No slash, so the prefix is the whole partial and directory is current path
                dirPath = currentPath;
                prefix = partial;
            }

            // Get all items in the directory
            const items = this.listDirectory(dirPath);

            // Filter for items that start with the prefix
            const matches = items
                .filter(item => item.name.toLowerCase().startsWith(prefix.toLowerCase()))
                .map(item => {
                    // Add trailing slash for directories
                    const name = item.type === 'directory' ? `${item.name}/` : item.name;

                    // If the partial path had a directory component, add it back
                    if (partial.includes('/')) {
                        const dirPart = partial.substring(0, partial.lastIndexOf('/') + 1);
                        return dirPart + name;
                    }

                    return name;
                });

            return matches;
        } catch (error) {
            console.error('Completion error:', error);
            return [];
        }
    }

    /**
     * Register a new program/component in the file system
     * @param path Path where to register the component
     * @param name Component name
     * @param componentPath Path to the component file
     * @param type Type of the component (program, scene, subscene)
     * @param description Description of the component
     */
    public static registerComponent(
        path: string,
        name: string,
        componentPath: string,
        type: 'program' | 'scene' | 'subscene',
        description = ''
    ): void {
        this.ensureInitialized();

        try {
            // Make sure the parent directory exists
            const parentDir = this.getItem(path);

            if (parentDir.type !== 'directory') {
                throw new Error(`Not a directory: ${path}`);
            }

            // Initialize children if not exists
            if (!parentDir.children) {
                parentDir.children = {};
            }

            // Register the component
            parentDir.children[name] = {
                name,
                type,
                component: componentPath,
                description
            };

            console.log(`Registered ${type} "${name}" at ${path}/${name}`);
        } catch (error) {
            console.error(`Failed to register component ${name}:`, error);
            throw error;
        }
    }

    /**
     * Ensure the file system is initialized
     * @private
     */
    private static ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('File system not initialized. Call FileSystem.initialize() first.');
        }
    }
}