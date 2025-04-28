import React, { useState, useRef, useEffect } from 'react';
import styles from './QuickMenu.module.css';
import { FileSystem } from '../../services/FileSystem';
import { FocusManager } from '../../services/FocusManager';
import UserBanner from '../UserBanner/UserBanner';
import CrtSettingsPanel from '../CrtEffects/CrtSettingsPanel.tsx';
import { DiscordAuthService } from '../../services/DiscordAuthService';

interface QuickMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (path: string, item: any) => void;
    isMobile: boolean;
    onMinimizeAll?: () => void;
    onCloseAll?: () => void;
    onCommandExecute?: (command: string) => void;
}

const QuickMenu: React.FC<QuickMenuProps> = ({
                                                 isOpen,
                                                 onClose,
                                                 onNavigate,
                                                 isMobile,
                                                 onMinimizeAll,
                                                 onCloseAll,
                                                 onCommandExecute
                                             }) => {
    const [currentPath, setCurrentPath] = useState('/home/user');
    const [previousPaths, setPreviousPaths] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [contents, setContents] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [settingsPage, setSettingsPage] = useState<'main' | 'themes' | 'effects'>('main');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = await DiscordAuthService.isAuthenticated();
            setIsAuthenticated(authenticated);
        };

        checkAuth();
        // Set interval to periodically check authentication status
        const interval = setInterval(checkAuth, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Set focus to the quick menu when opened
            FocusManager.setFocus('quickMenu');

            // Focus search input in mobile view
            if (isMobile && searchInputRef.current) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 100);
            }

            // Clear terminal focus
            if (window && (window as any).terminalHasFocus) {
                (window as any).terminalHasFocus = false;
            }
        }
    }, [isOpen, isMobile]);

    // Load directory contents when path changes or menu is opened
    useEffect(() => {
        if (!isOpen) return;

        try {
            // Load directory contents
            const items = FileSystem.listDirectory(currentPath);
            setContents(items);

            // Clear search when path changes
            setSearchQuery('');
            setSearchResults(null);
        } catch (error) {
            console.error('Error loading directory:', error);
            setContents([]);
        }
    }, [currentPath, isOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen && !isMobile) { // Only add event listener on desktop
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isMobile]);

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            // Check if quick menu has focus
            if (FocusManager.isQuickMenuFocused()) {
                switch (e.key) {
                    case 'Escape':
                        if (showSettingsMenu) {
                            handleBackFromSettings();
                        } else if (searchResults) {
                            // Clear search first
                            setSearchQuery('');
                            setSearchResults(null);
                        } else {
                            onClose();
                        }
                        break;

                    case 'Backspace':
                        if (e.target === searchInputRef.current && !searchQuery) {
                            goBack();
                        }
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, searchQuery, showSettingsMenu]);

    // Search logic
    useEffect(() => {
        if (!isOpen || !searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        if (searchTimeoutRef.current !== null) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = window.setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current !== null) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, isOpen]);

    // Scroll to top when content changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [currentPath, searchResults]);

    // Handle login/logout
    const handleAuthAction = () => {
        if (isAuthenticated) {
            // Logout
            DiscordAuthService.logout();
            setIsAuthenticated(false);
            // Show toast or notification
        } else {
            // Direct to Discord OAuth
            DiscordAuthService.login();
        }
    };

    // Execute command via the command executor
    const executeCommand = (command: string) => {
        if (onCommandExecute) {
            // Clear terminal focus when executing commands from menu
            if (window && (window as any).terminalHasFocus) {
                (window as any).terminalHasFocus = false;
            }

            onCommandExecute(command);
        } else {
            console.warn('Command execution function not available');

            // Handle file viewing directly if command executor is not available
            if (command.includes('cat ')) {
                try {
                    // Parse the command to get file path
                    const parts = command.split('&&').map(part => part.trim());

                    if (parts.length > 1) {
                        // Handle "cd /path && cat file.txt" format
                        const cdCommand = parts[0];
                        const dirPath = cdCommand.replace('cd ', '').trim();

                        const catCommand = parts[1];
                        const fileName = catCommand.replace('cat ', '').trim();

                        // Handle file directly
                        handleFileDirectly(dirPath, fileName);
                    } else {
                        // Handle "cat file.txt" format in current directory
                        const fileName = command.replace('cat ', '').trim();
                        handleFileDirectly(currentPath, fileName);
                    }
                } catch (error) {
                    console.error('Error processing file command:', error);
                }
            }
        }
    };

    const handleFileDirectly = (dirPath: string, fileName: string) => {
        try {
            // Create the full path
            const fullPath = FileSystem.resolvePath(`${dirPath}/${fileName}`, currentPath);

            // Get the file content - this may throw if file doesn't exist
            const content = FileSystem.getFileContent(fullPath);

            // Create a file item object to pass to onNavigate
            const fileItem = {
                name: fileName,
                type: 'file',
                content: content, // Pass content directly to avoid needing to fetch it again
                parentPath: dirPath
            };

            // Navigate directly using onNavigate
            onNavigate(fullPath, fileItem);

            // Close menu after navigation on desktop
            if (!isMobile) {
                onClose();
            }
        } catch (error) {
            console.error(`Error handling file: ${dirPath}/${fileName}`, error);
        }
    };

    // Perform search across the file system
    const performSearch = (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        try {
            const results: any[] = [];

            // Recursive function to search a directory
            const searchDirectory = (path: string) => {
                try {
                    const items = FileSystem.listDirectory(path);

                    for (const item of items) {
                        // Check if name matches query
                        if (item.name.toLowerCase().includes(query.toLowerCase())) {
                            results.push({
                                ...item,
                                path: `${path === '/' ? '' : path}/${item.name}`,
                                parentPath: path
                            });
                        }

                        // Recursively search subdirectories
                        if (item.type === 'directory') {
                            searchDirectory(`${path === '/' ? '' : path}/${item.name}`);
                        }

                        // Search file content for files
                        if (item.type === 'file') {
                            try {
                                const content = FileSystem.getFileContent(`${path === '/' ? '' : path}/${item.name}`);
                                if (content.toLowerCase().includes(query.toLowerCase())) {
                                    // Only add if not already in results
                                    if (!results.some(r => r.path === `${path === '/' ? '' : path}/${item.name}`)) {
                                        results.push({
                                            ...item,
                                            path: `${path === '/' ? '' : path}/${item.name}`,
                                            parentPath: path,
                                            matchesContent: true
                                        });
                                    }
                                }
                            } catch (error) {
                                console.warn(`Error reading file content: ${path}/${item.name}`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Error searching directory: ${path}`, error);
                }
            };

            // Start search at root directory
            searchDirectory('/');

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        }
    };

    // Navigate to a new path
    const navigateTo = (path: string) => {
        setPreviousPaths(prev => [...prev, currentPath]);
        setCurrentPath(path);
        setSearchResults(null);
        setSearchQuery('');

        // Unfocus search input on mobile when navigating
        if (isMobile && document.activeElement === searchInputRef.current) {
            searchInputRef.current?.blur();
        }
    };

    // Go back to the previous path
    const goBack = () => {
        if (showSettingsMenu) {
            handleBackFromSettings();
            return;
        }

        if (searchResults) {
            // Clear search results first
            setSearchResults(null);
            setSearchQuery('');
        } else if (previousPaths.length > 0) {
            // Go back to the previous path
            const prevPath = previousPaths[previousPaths.length - 1];
            setPreviousPaths(prev => prev.slice(0, -1));
            setCurrentPath(prevPath);
        } else if (currentPath !== '/home/user') {
            // Go to home directory if not already there
            setCurrentPath('/home/user');
        } else {
            // Close menu if already at home
            onClose();
        }
    };

    // Check if item is accessible
    const canAccess = (item: any) => {
        if (item.name.toLowerCase() === 'restricted') {
            return isAuthenticated;
        }
        return true;
    };

    // Handle item click
    const handleItemClick = (item: any) => {
        if (item.type === 'directory') {
            if (!canAccess(item)) return;

            // Navigate to directory
            navigateTo(`${item.parentPath || currentPath}/${item.name}`);
        } else if (item.type === 'file') {
            // Get the target directory
            const targetDir = searchResults ? item.parentPath : currentPath;

            if (onCommandExecute) {
                // If command executor is available, use it
                executeCommand(`cd ${targetDir} && cat ${item.name}`);
            } else {
                // Otherwise handle file directly
                handleFileDirectly(targetDir, item.name);
            }

            // Close menu after navigation on desktop
            if (!isMobile) {
                onClose();
            }
        } else {
            // Launch program, scene, subscene
            onNavigate(`${item.parentPath || currentPath}/${item.name}`, item);

            // Close menu after navigation
            if (!isMobile) {
                onClose();
            }
        }
    };

    // Format path for display
    const formatPath = (path: string) => {
        if (path === '/') return '/';

        const parts = path.split('/').filter(Boolean);
        if (parts.length <= 2) {
            return path;
        }

        return `.../${parts.slice(-2).join('/')}`;
    };

    // Open settings menu
    const openSettings = () => {
        setShowSettingsMenu(true);
        setSettingsPage('main');
    };

    // Handle back from settings
    const handleBackFromSettings = () => {
        if (settingsPage !== 'main') {
            setSettingsPage('main');
        } else {
            setShowSettingsMenu(false);
        }
    };

    // Navigate to specific settings page
    const navigateToSettingsPage = (page: 'themes' | 'effects') => {
        setSettingsPage(page);
    };

    // Handle window management commands
    const handleWindowCommand = (command: string) => {
        if (command === 'minimizeAll') {
            if (onMinimizeAll) onMinimizeAll();
        } else if (command === 'closeAll') {
            if (onCloseAll) onCloseAll();
        }

        // Close menu after executing command
        if (!isMobile) {
            onClose();
        }
    };

    // If menu is not open, don't render anything
    if (!isOpen) {
        return null;
    }

    // If showing settings menu
    if (showSettingsMenu) {
        return (
            <div
                className={`${styles.quickMenu} ${isMobile ? styles.mobile : ''}`}
                ref={menuRef}
            >
                <div className={styles.header}>
                    <div className={styles.navigationBar}>
                        <button
                            className={styles.backButton}
                            onClick={handleBackFromSettings}
                        >
                            <span className={styles.backIcon}>◄</span>
                            <span className={styles.backText}>BACK</span>
                        </button>

                        <div className={styles.currentPath}>
                            {settingsPage === 'main' ? 'SETTINGS' :
                                settingsPage === 'themes' ? 'THEMES' : 'EFFECTS'}
                        </div>

                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                        >
                            <span className={styles.closeIcon}>×</span>
                        </button>
                    </div>
                </div>

                <div className={styles.content} ref={contentRef}>
                    {settingsPage === 'main' && (
                        <div className={styles.section}>
                            <div className={styles.itemGrid}>
                                <div
                                    className={styles.item}
                                    onClick={() => navigateToSettingsPage('themes')}
                                >
                                    <div className={styles.itemIcon}>
                                        <span className={styles.programIcon}>🎨</span>
                                    </div>
                                    <div className={styles.itemName}>Themes</div>
                                    <div className={styles.itemDescription}>Change visual theme</div>
                                </div>

                                <div
                                    className={styles.item}
                                    onClick={() => navigateToSettingsPage('effects')}
                                >
                                    <div className={styles.itemIcon}>
                                        <span className={styles.programIcon}>✨</span>
                                    </div>
                                    <div className={styles.itemName}>Effects</div>
                                    <div className={styles.itemDescription}>Toggle visual effects</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {settingsPage === 'themes' && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>THEMES</div>
                            <div className={styles.itemGrid}>
                                <div className={styles.item}>
                                    <div className={styles.itemIcon}>
                                        <span className={styles.programIcon}>🟩</span>
                                    </div>
                                    <div className={styles.itemName}>Terminal Green</div>
                                </div>
                                <div className={styles.item}>
                                    <div className={styles.itemIcon}>
                                        <span className={styles.programIcon}>🟦</span>
                                    </div>
                                    <div className={styles.itemName}>Blue Matrix</div>
                                </div>
                                <div className={styles.item}>
                                    <div className={styles.itemIcon}>
                                        <span className={styles.programIcon}>⬜</span>
                                    </div>
                                    <div className={styles.itemName}>Light Mode</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {settingsPage === 'effects' && (
                        <CrtSettingsPanel onBack={handleBackFromSettings} />
                    )}
                </div>

                {/* Window controls section - only show if not in effects page */}
                {settingsPage !== 'effects' && (
                    <div className={styles.menuControls}>
                        <div className={styles.sectionHeader}>WINDOW CONTROLS</div>
                        <ul className={styles.menuList}>
                            <li
                                className={styles.menuItem}
                                onClick={() => handleWindowCommand('minimizeAll')}
                            >
                                <span className={styles.minimizeAll}>MINIMIZE ALL</span>
                            </li>
                            <li
                                className={styles.menuItem}
                                onClick={() => handleWindowCommand('closeAll')}
                            >
                                <span className={styles.closeAll}>CLOSE ALL</span>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Mobile-specific back button for settings */}
                {isMobile && (
                    <div className={styles.mobileFooter}>
                        <button
                            className={styles.footerButton}
                            onClick={handleBackFromSettings}
                        >
                            <span className={styles.buttonIcon}>◄</span>
                            <span>BACK</span>
                        </button>
                        <button
                            className={styles.footerButton}
                            onClick={onClose}
                        >
                            <span className={styles.buttonIcon}>×</span>
                            <span>CLOSE</span>
                        </button>
                    </div>
                )}

                {/* User Banner */}
                <UserBanner onLogout={handleAuthAction} />
            </div>
        );
    }

    // Determine what content to show
    const displayContents = searchResults || contents;

    // Group contents by type for display
    const directories = displayContents.filter(item => item.type === 'directory');
    const programs = displayContents.filter(item =>
        item.type === 'program' || item.type === 'scene' || item.type === 'subscene'
    );
    const files = displayContents.filter(item => item.type === 'file');

    return (
        <div
            className={`${styles.quickMenu} ${isMobile ? styles.mobile : ''}`}
            ref={menuRef}
        >
            <div className={styles.header}>
                <div className={styles.navigationBar}>
                    <button
                        className={styles.backButton}
                        onClick={goBack}
                        disabled={previousPaths.length === 0 && !searchResults && currentPath === '/home/user'}
                    >
                        <span className={styles.backIcon}>◄</span>
                        <span className={styles.backText}>BACK</span>
                    </button>

                    <div className={styles.currentPath}>
                        {searchResults ? 'SEARCH RESULTS' : formatPath(currentPath)}
                    </div>

                    <div className={styles.headerButtons}>
                        <button
                            className={styles.settingsButton}
                            onClick={openSettings}
                            title="Settings"
                        >
                            <span className={styles.settingsIcon}>⚙️</span>
                        </button>
                        {!isMobile && (
                            <button
                                className={styles.closeButton}
                                onClick={onClose}
                                title="Close"
                            >
                                <span className={styles.closeIcon}>×</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className={`${styles.searchBar} ${isSearchFocused ? styles.searchFocused : ''}`}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search files and programs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearSearch}
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults(null);
                                searchInputRef.current?.focus();
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.content} ref={contentRef}>
                {displayContents.length === 0 ? (
                    <div className={styles.emptyState}>
                        {searchResults !== null
                            ? 'No search results found'
                            : 'This directory is empty'}
                    </div>
                ) : (
                    <>
                        {directories.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>DIRECTORIES</div>
                                <div className={styles.itemGrid}>
                                    {directories.map((item, index) => (
                                        <div
                                            key={`dir-${index}`}
                                            className={`${styles.item} ${!canAccess(item) ? styles.locked : ''}`}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className={styles.itemIcon}>
                                                <span className={styles.folderIcon}>
                                                    {canAccess(item) ? '📁' : '🔒'}
                                                </span>
                                            </div>
                                            <div className={styles.itemName}>{item.name}</div>
                                            {searchResults && (
                                                <div className={styles.itemPath}>{item.parentPath}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {programs.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>PROGRAMS</div>
                                <div className={styles.itemGrid}>
                                    {programs.map((item, index) => (
                                        <div
                                            key={`program-${index}`}
                                            className={styles.item}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className={styles.itemIcon}>
                                                <span className={styles.programIcon}>
                                                    {item.type === 'program' ? '⚙️' : item.type === 'scene' ? '🖼️' : '🪟'}
                                                </span>
                                            </div>
                                            <div className={styles.itemName}>{item.name}</div>
                                            {item.description && (
                                                <div className={styles.itemDescription}>{item.description}</div>
                                            )}
                                            {searchResults && (
                                                <div className={styles.itemPath}>{item.parentPath}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>FILES</div>
                                <div className={styles.itemGrid}>
                                    {files.map((item, index) => (
                                        <div
                                            key={`file-${index}`}
                                            className={styles.item}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className={styles.itemIcon}>
                                                <span className={styles.fileIcon}>📄</span>
                                                {item.matchesContent && (
                                                    <span className={styles.matchBadge}>Match</span>
                                                )}
                                            </div>
                                            <div className={styles.itemName}>{item.name}</div>
                                            {searchResults && (
                                                <div className={styles.itemPath}>{item.parentPath}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Window controls section - only show on desktop or if not at the very bottom */}
            {(!isMobile || currentPath !== '/home/user') && (
                <div className={styles.menuControls}>
                    <div className={styles.sectionHeader}>WINDOW CONTROLS</div>
                    <ul className={styles.menuList}>
                        <li
                            className={styles.menuItem}
                            onClick={() => handleWindowCommand('minimizeAll')}
                        >
                            <span className={styles.minimizeAll}>MINIMIZE ALL</span>
                        </li>
                        <li
                            className={styles.menuItem}
                            onClick={() => handleWindowCommand('closeAll')}
                        >
                            <span className={styles.closeAll}>CLOSE ALL</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* User Banner - pass isMobile prop */}
            <UserBanner
                onLogout={handleAuthAction}
                isMobile={isMobile}
            />

            {/* Mobile footer navigation bar - fixed position at bottom */}
            {isMobile && (
                <div className={styles.mobileFooter}>
                    <button className={styles.footerButton} onClick={() => navigateTo('/home/user')}>
                        <span className={styles.buttonIcon}>🏠</span>
                        <span>HOME</span>
                    </button>
                    <button className={styles.footerButton} onClick={() => navigateTo('/home/user/programs')}>
                        <span className={styles.buttonIcon}>⚙️</span>
                        <span>PROGRAMS</span>
                    </button>
                    <button className={styles.footerButton} onClick={() => navigateTo('/home/user/documents')}>
                        <span className={styles.buttonIcon}>📄</span>
                        <span>DOCS</span>
                    </button>
                    <button className={styles.footerButton} onClick={onClose}>
                        <span className={styles.buttonIcon}>×</span>
                        <span>CLOSE</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuickMenu;