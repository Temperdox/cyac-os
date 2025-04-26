import React, { useState, useRef, useEffect } from 'react';
import styles from './QuickMenu.module.css';
import { FileSystem } from '../../services/FileSystem';
import { FocusManager } from '../../services/FocusManager';
import UserBanner from '../UserBanner/UserBanner';

interface QuickMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (path: string, item: any) => void;
    isMobile: boolean;
}

const QuickMenu: React.FC<QuickMenuProps> = ({
                                                 isOpen,
                                                 onClose,
                                                 onNavigate,
                                                 isMobile
                                             }) => {
    const [currentPath, setCurrentPath] = useState('/home/user');
    const [previousPaths, setPreviousPaths] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [contents, setContents] = useState<any[]>([]);

    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<number | null>(null);

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
                        onClose();
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
    }, [isOpen, onClose, searchQuery]);

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

    // Handle item click
    const handleItemClick = (item: any) => {
        if (item.type === 'directory') {
            // Navigate to directory
            navigateTo(`${item.parentPath || currentPath}/${item.name}`);
        } else {
            // Launch program, scene, subscene or open file
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

    // If menu is not open, don't render anything
    if (!isOpen) {
        return null;
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
            {/* User banner at the top */}
            <UserBanner onLogout={onClose} />

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

                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <span className={styles.closeIcon}>×</span>
                    </button>
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

            <div className={styles.content}>
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
                                            className={styles.item}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className={styles.itemIcon}>
                                                <span className={styles.folderIcon}>📁</span>
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
                        <button className={styles.footerButton} onClick={() => navigateTo('/sys/config')}>
                            <span className={styles.buttonIcon}>⚙️</span>
                            <span>SETTINGS</span>
                        </button>
                    </div>
                ) : (
                    <div className={styles.statusBar}>
                        <div className={styles.itemCount}>
                            {displayContents.length} item{displayContents.length !== 1 ? 's' : ''}
                        </div>
                        <div className={styles.systemStatus}>
                            <span className={styles.statusIndicator}></span>
                            SYSTEM ONLINE
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickMenu;