import React, { useState, useRef, useEffect } from 'react';
import styles from './QuickMenu.module.css';
import { FileSystem } from '../../services/FileSystem';
import { FocusManager } from '../../services/FocusManager';
import UserBanner from '../UserBanner/UserBanner';
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
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [settingsPage, setSettingsPage] = useState<'main' | 'themes' | 'effects'>('main');
    const [showUserMenu, setShowUserMenu] = useState(false);

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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

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
                        } else if (showUserMenu) {
                            setShowUserMenu(false);
                        } else if (showLoginModal) {
                            setShowLoginModal(false);
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
    }, [isOpen, onClose, searchQuery, showSettingsMenu, showUserMenu, showLoginModal]);

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

    // Smooth scrolling for content area
    useEffect(() => {
        if (contentRef.current) {
            const content = contentRef.current;
            let scrolling = false;
            let scrollAmount = 0;

            const smoothScroll = () => {
                if (!scrolling) return;

                content.scrollTop += scrollAmount;
                requestAnimationFrame(smoothScroll);
            };

            const startScroll = (amount: number) => {
                scrollAmount = amount;
                if (!scrolling) {
                    scrolling = true;
                    smoothScroll();
                }
            };

            const stopScroll = () => {
                scrolling = false;
            };

            // Add wheel event for smooth scrolling
            const handleWheel = (e: WheelEvent) => {
                e.preventDefault();
                const amount = e.deltaY * 0.2;
                startScroll(amount);

                // Stop scrolling after a short delay
                setTimeout(stopScroll, 100);
            };

            content.addEventListener('wheel', handleWheel, { passive: false });

            return () => {
                content.removeEventListener('wheel', handleWheel);
            };
        }
    }, [isOpen]);

    // Execute command via the command executor (if provided)
    const executeCommand = (command: string) => {
        if (onCommandExecute) {
            // Clear terminal focus when executing commands from menu
            if (window && (window as any).terminalHasFocus) {
                (window as any).terminalHasFocus = false;
            }

            onCommandExecute(command);
        } else {
            console.warn('Command execution function not available');
        }
    };

    // Execute command for window management
    const executeWindowCommand = (command: string) => {
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
    };

    // Go back to the previous path
    const goBack = () => {
        if (showSettingsMenu) {
            handleBackFromSettings();
            return;
        }

        if (showUserMenu) {
            setShowUserMenu(false);
            return;
        }

        if (showLoginModal) {
            setShowLoginModal(false);
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
            // Execute command to open file
            const targetDir = searchResults ? item.parentPath : currentPath;
            executeCommand(`cd ${targetDir} && cat ${item.name}`);

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
        setShowUserMenu(false);
        setShowLoginModal(false);
    };

    // Toggle user menu
    const toggleUserMenu = () => {
        setShowUserMenu(prev => !prev);
        if (showSettingsMenu) {
            setShowSettingsMenu(false);
        }
        if (showLoginModal) {
            setShowLoginModal(false);
        }
    };

    // Handle login click
    const handleLoginClick = () => {
        setShowLoginModal(true);
        setShowUserMenu(false);
        setShowSettingsMenu(false);
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

    // Toggle CRT effects
    const toggleCrtEffects = () => {
        // This would connect to your CRT effects service/context
        console.log('Toggle CRT effects');
        // Example:
        // crtEffectsContext.toggleAllEffects();
    };

    // Render Login Modal
    const renderLoginModal = () => {
        if (!showLoginModal) return null;

        return (
            <div className={styles.loginModalOverlay}>
                <div className={styles.loginModal}>
                    <h3>CYBERACME AUTHENTICATION</h3>

                    {loginError && <div className={styles.loginError}>{loginError}</div>}

                    <div className={styles.discordLoginSection}>
                        <div className={styles.discordLogo}>
                            <svg width="40" height="40" viewBox="0 0 71 55" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.4349C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
                            </svg>
                        </div>
                        <button
                            className={styles.discordLoginButton}
                            onClick={() => {
                                try {
                                    DiscordAuthService.login();
                                    setShowLoginModal(false);
                                } catch (error) {
                                    console.error("Failed to start Discord auth:", error);
                                    setLoginError("Failed to authenticate. Please try again.");
                                }
                            }}
                        >
                            LOGIN WITH DISCORD
                        </button>
                    </div>

                    <div className={styles.loginButtons}>
                        <button type="button" onClick={() => setShowLoginModal(false)}>CANCEL</button>
                    </div>
                </div>
            </div>
        );
    };

    // If menu is not open, don't render anything
    if (!isOpen) {
        return null;
    }

    // If showing login modal
    if (showLoginModal) {
        return renderLoginModal();
    }

    // If showing user menu
    if (showUserMenu) {
        return (
            <div
                className={`${styles.quickMenu} ${isMobile ? styles.mobile : ''}`}
                ref={menuRef}
            >
                <div className={styles.header}>
                    <div className={styles.navigationBar}>
                        <button
                            className={styles.backButton}
                            onClick={() => setShowUserMenu(false)}
                        >
                            <span className={styles.backIcon}>◄</span>
                            <span className={styles.backText}>BACK</span>
                        </button>

                        <div className={styles.currentPath}>USER MENU</div>

                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                        >
                            <span className={styles.closeIcon}>×</span>
                        </button>
                    </div>
                </div>

                <UserBanner
                    onLogout={() => {
                        setShowUserMenu(false);
                        onClose();
                    }}
                    onMinimizeAll={onMinimizeAll}
                    onCloseAll={onCloseAll}
                />
            </div>
        );
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
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>CRT EFFECTS</div>
                            <div className={styles.effectsToggle}>
                                <label className={styles.toggleSwitch}>
                                    <input type="checkbox" onChange={toggleCrtEffects} />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                                <span className={styles.effectsLabel}>Enable CRT Effects</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.statusBar}>
                        <div className={styles.itemCount}>
                            SETTINGS
                        </div>
                        <div className={styles.systemStatus}>
                            <span className={styles.statusIndicator}></span>
                            {isAuthenticated ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                        </div>
                    </div>
                </div>
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
                            className={styles.userButton}
                            onClick={toggleUserMenu}
                            title="User Menu"
                        >
                            <span className={styles.userIcon}>👤</span>
                        </button>
                        <button
                            className={styles.settingsButton}
                            onClick={openSettings}
                            title="Settings"
                        >
                            <span className={styles.settingsIcon}>⚙️</span>
                        </button>
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            title="Close"
                        >
                            <span className={styles.closeIcon}>×</span>
                        </button>
                    </div>
                </div>

                <div className={styles.searchBar}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search files and programs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

            <div className={styles.footer}>
                {isMobile ? (
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
                        <button className={styles.footerButton} onClick={() => executeWindowCommand('minimizeAll')}>
                            <span className={styles.buttonIcon}>▼</span>
                            <span>MINIMIZE</span>
                        </button>
                    </div>
                ) : (
                    <div className={styles.statusBar}>
                        <div className={styles.itemCount}>
                            {displayContents.length} item{displayContents.length !== 1 ? 's' : ''}
                        </div>
                        <div className={styles.systemStatus}>
                            <span className={styles.statusIndicator}></span>
                            {isAuthenticated ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                        </div>
                        {!isAuthenticated && (
                            <button
                                className={styles.discordLoginButton}
                                onClick={handleLoginClick}
                            >
                                <span className={styles.discordIcon}>
                                    <svg width="16" height="16" viewBox="0 0 71 55" fill="#33ff33" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.4349C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
                                    </svg>
                                </span>
                                LOGIN WITH DISCORD
                            </button>
                        )}
                    </div>
                )}
            </div>

            {renderLoginModal()}
        </div>
    );
};

export default QuickMenu;