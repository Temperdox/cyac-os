import React, { useState, useEffect, useRef, JSX } from 'react';
import styles from './CyAc_browser_v1.module.css';
import NetworkTrafficDisplay from './NetworkTrafficDisplay';
import ConnectionAnimation from './ConnectionAnimation';
import SimpleLoadingIndicator from './SimpleLoadingIndicator';

// Define site data types
interface SiteData {
    id: string;
    name: string;
    url: string;
    isMobile?: boolean;
    component: JSX.Element;
}

// Define the browser component
const EnhancedMinimalBrowser: React.FC<{ isMobile?: boolean, hasKeyboardFocus?: boolean }> = ({
                                                                                                  hasKeyboardFocus = false
                                                                                              }) => {
    // State for URL and navigation
    const [currentUrl, setCurrentUrl] = useState('newtab');
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>(['newtab']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [showFullUrl, setShowFullUrl] = useState(false);
    const [tabs, setTabs] = useState<{ id: string, url: string }[]>([{ id: 'tab1', url: 'newtab' }]);
    const [activeTabId, setActiveTabId] = useState('tab1');
    const [sites, setSites] = useState<SiteData[]>([]);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    // Add state for connection animation
    const [showConnectionAnimation, setShowConnectionAnimation] = useState(false);
    const [pendingUrl, setPendingUrl] = useState('');
    const [_animationComplete, setAnimationComplete] = useState(false);
    const [hasHardwareAcceleration, setHasHardwareAcceleration] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const loadingTimeout = useRef<number | null>(null);

    // Track window size for responsive design
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine if we're on mobile based on window size
    const isDeviceMobile = windowSize.width <= 768;

    // Improved hardware acceleration detection
    useEffect(() => {
        const detectHardwareAcceleration = () => {
            try {
                // Create a test canvas
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') as WebGLRenderingContext | null ||
                    canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

                if (!gl) {
                    console.log("WebGL not available - no hardware acceleration");
                    return false;
                }

                // Try to get renderer info
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    console.log("GPU renderer:", renderer);

                    // Common software renderers to detect
                    const softwareRenderers = [
                        'swiftshader',
                        'software',
                        'microsoft basic render',
                        'llvmpipe',
                        'virtualbox',
                        'basic rendering'
                    ];

                    const isSoftwareRenderer = softwareRenderers.some(
                        name => String(renderer).toLowerCase().includes(name)
                    );

                    if (isSoftwareRenderer) {
                        console.log("Software renderer detected - no hardware acceleration");
                        return false;
                    }
                }

                // If we got here, assume hardware acceleration is available
                return true;
            } catch (e) {
                console.error("Error detecting hardware acceleration:", e);
                // Assume true if detection fails
                return true;
            }
        };

        // Check for reduced motion preference
        const hasReducedMotion = typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Set hardware acceleration state, but respect reduced motion preference
        const hasAcceleration = !hasReducedMotion && detectHardwareAcceleration();
        console.log("Hardware acceleration detection result:", hasAcceleration);
        setHasHardwareAcceleration(hasAcceleration);

    }, []);

    // Load sites from external modules using the index file
    useEffect(() => {
        const loadSites = async () => {
            try {
                setIsLoading(true);

                // Import sites from the index file
                const sitesModule = await import('./sites');

                // Use the SITES array from the index
                setSites(sitesModule.SITES);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to load sites:", error);
                setIsLoading(false);
            }
        };

        loadSites().then(() => console.log('Sites loaded!'));
    }, []);

    // Find a site by URL
    const findSite = (url: string): SiteData | null => {
        if (!url || url === 'newtab') return null;

        const cleanUrl = url.toLowerCase().trim();
        return sites.find(site =>
            site.url.toLowerCase() === cleanUrl ||
            site.id.toLowerCase() === cleanUrl
        ) || null;
    };

    // Prepare Google search URL
    const prepareGoogleSearchUrl = (query: string) => {
        return `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`;
    };

    // Clear any loading timeouts
    const clearTimeouts = () => {
        if (loadingTimeout.current !== null) {
            window.clearTimeout(loadingTimeout.current);
            loadingTimeout.current = null;
        }
    };

    // Handle navigation to a new URL - Fixed version
    const navigateTo = (url: string, updateHistory = true) => {
        clearTimeouts();

        console.log("Navigating to:", url);

        // Trim and format URL if needed
        const trimmedUrl = url.trim();

        // Check if we need to show connection animation (only for external URLs)
        const isExternal = trimmedUrl !== 'newtab' && !findSite(trimmedUrl);

        // Skip animation for low-end devices or when hardware acceleration is off
        const shouldShowAnimation = isExternal && hasHardwareAcceleration && !isDeviceMobile;

        console.log("Navigation checks:", {
            isExternal,
            hasHardwareAccel: hasHardwareAcceleration,
            isDeviceMobile,
            shouldShowAnimation
        });

        // Simple version for low-end devices or when hardware accel is disabled
        if (isExternal && !shouldShowAnimation) {
            console.log("Using simplified loading for external URL");
            setIsLoading(true);

            // Update the current URL and input field
            setCurrentUrl(trimmedUrl);
            setInputValue(trimmedUrl);

            // Update the active tab's URL
            setTabs(prevTabs =>
                prevTabs.map(tab =>
                    tab.id === activeTabId ? { ...tab, url: trimmedUrl } : tab
                )
            );

            // Update history
            if (updateHistory) {
                if (historyIndex < history.length - 1) {
                    setHistory(prev => [...prev.slice(0, historyIndex + 1), trimmedUrl]);
                    setHistoryIndex(historyIndex + 1);
                } else {
                    setHistory(prev => [...prev, trimmedUrl]);
                    setHistoryIndex(prev => prev + 1);
                }
            }

            // Slightly longer loading time to simulate connection process
            loadingTimeout.current = window.setTimeout(() => {
                setIsLoading(false);
            }, 1200);

            return;
        }

        // Full animation version - FIXED PATH - When we need to show animation
        if (shouldShowAnimation) {
            console.log("Showing full connection animation for:", trimmedUrl);

            setPendingUrl(trimmedUrl);
            setIsLoading(true);

            // Important: Set this last to ensure state changes are batched correctly
            setShowConnectionAnimation(true);

            // Update tab URL for better UX but don't update current URL until animation completes
            setTabs(prevTabs =>
                prevTabs.map(tab =>
                    tab.id === activeTabId ? { ...tab, url: trimmedUrl } : tab
                )
            );

            return;
        }

        // Standard navigation for internal sites and newtab
        console.log("Using standard navigation for internal site or newtab");
        setIsLoading(true);

        // Update the current URL and input field
        setCurrentUrl(trimmedUrl);
        if (trimmedUrl !== 'newtab') {
            setInputValue(trimmedUrl);
        } else {
            setInputValue('');
        }

        // Update the active tab's URL
        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === activeTabId ? { ...tab, url: trimmedUrl } : tab
            )
        );

        // Update history if needed
        if (updateHistory) {
            // If we're not at the end of history, truncate it
            if (historyIndex < history.length - 1) {
                setHistory(prev => [...prev.slice(0, historyIndex + 1), trimmedUrl]);
                setHistoryIndex(historyIndex + 1);
            } else {
                // Otherwise just append
                setHistory(prev => [...prev, trimmedUrl]);
                setHistoryIndex(prev => prev + 1);
            }
        }

        // Simulate loading delay
        loadingTimeout.current = window.setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    // Handle connection animation completion - FIXED VERSION
    const handleConnectionComplete = React.useCallback(() => {
        console.log("Connection animation complete, continuing navigation to:", pendingUrl);

        // Complete the navigation process
        const url = pendingUrl;

        // First hide the animation
        setShowConnectionAnimation(false);
        setAnimationComplete(true);

        // Set a small timeout before updating UI state to ensure smooth transition
        setTimeout(() => {
            // Update the current URL and input field
            setCurrentUrl(url);
            setInputValue(url);

            // Update history
            if (historyIndex < history.length - 1) {
                setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
                setHistoryIndex(historyIndex + 1);
            } else {
                setHistory(prev => [...prev, url]);
                setHistoryIndex(prev => prev + 1);
            }

            // Set loading to false after a short delay
            loadingTimeout.current = window.setTimeout(() => {
                setIsLoading(false);
            }, 300);
        }, 50);
    }, [pendingUrl, historyIndex, history.length, activeTabId]);

    // Update dependency array to include all required dependencies
    useEffect(() => {
        // This effect ensures handleConnectionComplete has the latest state values
    }, [handleConnectionComplete, pendingUrl, historyIndex, history.length, activeTabId]);

    // Go back in history
    const goBack = () => {
        if (historyIndex > 0) {
            clearTimeouts();
            setIsLoading(true);
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);

            const previousUrl = history[newIndex];
            setCurrentUrl(previousUrl);
            if (previousUrl !== 'newtab') {
                setInputValue(previousUrl);
            } else {
                setInputValue('');
            }

            // Update the active tab's URL
            setTabs(prevTabs =>
                prevTabs.map(tab =>
                    tab.id === activeTabId ? { ...tab, url: previousUrl } : tab
                )
            );

            // Simulate loading delay
            loadingTimeout.current = window.setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    };

    // Go forward in history
    const goForward = () => {
        if (historyIndex < history.length - 1) {
            clearTimeouts();
            setIsLoading(true);
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);

            const nextUrl = history[newIndex];
            setCurrentUrl(nextUrl);
            if (nextUrl !== 'newtab') {
                setInputValue(nextUrl);
            } else {
                setInputValue('');
            }

            // Update the active tab's URL
            setTabs(prevTabs =>
                prevTabs.map(tab =>
                    tab.id === activeTabId ? { ...tab, url: nextUrl } : tab
                )
            );

            // Simulate loading delay
            loadingTimeout.current = window.setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Don't do anything if input is empty
        const trimmedInput = inputValue.trim();
        if (!trimmedInput) return;

        navigateTo(trimmedInput);
    };

    // Create a new tab
    const createNewTab = () => {
        const newTabId = `tab${Date.now()}`;
        setTabs([...tabs, { id: newTabId, url: 'newtab' }]);
        setActiveTabId(newTabId);
        setCurrentUrl('newtab');
        setInputValue('');
        setHistoryIndex(0);
        setHistory(['newtab']);
    };

    // Switch to a different tab
    const switchToTab = (tabId: string) => {
        if (tabId === activeTabId) return;

        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            setActiveTabId(tabId);
            setCurrentUrl(tab.url);
            if (tab.url !== 'newtab') {
                setInputValue(tab.url);
            } else {
                setInputValue('');
            }
            // Reset history for simplicity
            setHistoryIndex(0);
            setHistory([tab.url]);
        }
    };

    // Close a tab
    const closeTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering switchToTab

        // Don't close if it's the only tab
        if (tabs.length <= 1) return;

        const newTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(newTabs);

        // If we closed the active tab, switch to the last tab
        if (tabId === activeTabId) {
            const newActiveTab = newTabs[newTabs.length - 1];
            switchToTab(newActiveTab.id);
        }
    };

    // Reload the current page
    const reload = () => {
        clearTimeouts();
        setIsLoading(true);

        // Show animation again for external URLs when reloading
        const shouldShowAnimation = currentUrl !== 'newtab' &&
            !findSite(currentUrl) &&
            hasHardwareAcceleration &&
            !isDeviceMobile;

        console.log("Reload checks:", {
            isExternal: currentUrl !== 'newtab' && !findSite(currentUrl),
            hasHardwareAccel: hasHardwareAcceleration,
            isDeviceMobile,
            shouldShowAnimation
        });

        // If it's an external URL but we shouldn't show animation (low-end device)
        if (currentUrl !== 'newtab' && !findSite(currentUrl) && !shouldShowAnimation) {
            console.log("Using simplified reload for external URL");
            // Longer loading time to simulate the connection process
            loadingTimeout.current = window.setTimeout(() => {
                setIsLoading(false);
            }, 1200);
            return;
        }

        // Show animation for high-end devices
        if (shouldShowAnimation) {
            console.log("Showing animation during reload for:", currentUrl);
            setPendingUrl(currentUrl);

            // Important: Set this last to ensure state changes are batched correctly
            setShowConnectionAnimation(true);
            return;
        }

        // Simulate loading delay for internal pages
        loadingTimeout.current = window.setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    // Handle URL input focus
    const handleUrlFocus = () => {
        if (inputRef.current) {
            inputRef.current.select();
            setShowFullUrl(true);
        }
    };

    // Handle URL input blur
    const handleUrlBlur = () => {
        if (isDeviceMobile) {
            setShowFullUrl(false);
        }
    };

    // Format URL for display
    const getDisplayUrl = () => {
        if (!isDeviceMobile || showFullUrl || currentUrl === 'newtab') return inputValue;

        try {
            const urlObj = new URL(inputValue.startsWith('http') ? inputValue : `https://${inputValue}`);
            return urlObj.hostname;
        } catch (e) {
            return inputValue;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimeouts();
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hasKeyboardFocus) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.altKey) {
                        e.preventDefault();
                        goBack();
                    }
                    break;
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        goForward();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        reload();
                    }
                    break;
                case 't':
                case 'T':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        createNewTab();
                    }
                    break;
                case 'l':
                case 'L':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (inputRef.current) {
                            inputRef.current.focus();
                            inputRef.current.select();
                        }
                    }
                    break;
                case 'w':
                case 'W':
                    if (e.ctrlKey || e.metaKey && tabs.length > 1) {
                        e.preventDefault();
                        closeTab(activeTabId, {} as React.MouseEvent);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasKeyboardFocus, goBack, goForward, history, historyIndex, tabs, activeTabId]);

    // SpeedDialGrid component for paginated bookmarks with responsive layout
    const SpeedDialGrid: React.FC<{ sites: SiteData[] }> = ({ sites }) => {
        // SpeedDialGrid implementation (unchanged)
        const [currentPage, setCurrentPage] = useState(0);

        // Responsive grid configuration
        const columns = isDeviceMobile ? 3 : 6;
        const rows = isDeviceMobile ? 4 : 2;
        const sitesPerPage = columns * rows;

        const totalPages = Math.ceil(sites.length / sitesPerPage);

        // Ref for the scroll container
        const gridRef = useRef<HTMLDivElement>(null);

        // Handle scroll and snap to next/prev page
        const handleScroll = (direction: 'next' | 'prev') => {
            if (direction === 'next' && currentPage < totalPages - 1) {
                setCurrentPage(currentPage + 1);
            } else if (direction === 'prev' && currentPage > 0) {
                setCurrentPage(currentPage - 1);
            }
        };

        // Handle touch swipe for mobile
        const [touchStart, setTouchStart] = useState<number | null>(null);
        const [touchEnd, setTouchEnd] = useState<number | null>(null);

        const handleTouchStart = (e: React.TouchEvent) => {
            setTouchStart(e.targetTouches[0].clientY);
        };

        const handleTouchMove = (e: React.TouchEvent) => {
            setTouchEnd(e.targetTouches[0].clientY);
        };

        const handleTouchEnd = () => {
            if (!touchStart || !touchEnd) return;

            const distance = touchStart - touchEnd;
            const isSwipeDown = distance < -50;
            const isSwipeUp = distance > 50;

            if (isSwipeUp) {
                handleScroll('next');
            } else if (isSwipeDown) {
                handleScroll('prev');
            }

            setTouchStart(null);
            setTouchEnd(null);
        };

        // Auto-scroll to current page when it changes
        useEffect(() => {
            if (gridRef.current) {
                gridRef.current.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            }
        }, [currentPage]);

        // Get sites for current page
        const currentSites = sites.slice(
            currentPage * sitesPerPage,
            (currentPage + 1) * sitesPerPage
        );

        // Fill with empty slots if needed
        const filledSites = [...currentSites];
        while (filledSites.length < sitesPerPage) {
            filledSites.push({
                id: `empty-${filledSites.length}`,
                name: '',
                url: '',
                component: <></>
            });
        }

        return (
            <div
                className={styles.speedDialContainer}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={styles.speedDialGrid}
                    ref={gridRef}
                    style={{
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`
                    }}
                >
                    {filledSites.map((site) => (
                        <div
                            key={site.id}
                            className={`${styles.speedDialItem} ${!site.url ? styles.emptySpeedDial : ''} ${site.isMobile ? styles.mobileFlaggedItem : ''}`}
                            onClick={() => site.url ? navigateTo(site.url) : null}
                        >
                            {site.url && (
                                <>
                                    <div className={styles.speedDialIcon}>{site.id.charAt(0).toUpperCase()}</div>
                                    <div className={styles.speedDialName}>{site.name}</div>
                                    <div className={styles.speedDialUrl}>{site.url}</div>
                                    <div className={styles.speedDialDesc}>{site.id}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination controls would go here */}
            </div>
        );
    };

    // Get the active tab's content - FIXED VERSION
    const getTabContent = () => {
        console.log("Getting tab content:", {
            showConnectionAnimation,
            hasHardwareAcceleration,
            isDeviceMobile,
            pendingUrl,
            currentUrl
        });

        // If showing connection animation, render that based on hardware acceleration
        if (showConnectionAnimation) {
            if (hasHardwareAcceleration && !isDeviceMobile) {
                // Full animation for capable devices
                console.log("Rendering full connection animation for:", pendingUrl);
                return (
                    <ConnectionAnimation
                        url={pendingUrl}
                        onComplete={handleConnectionComplete}
                    />
                );
            } else {
                // Simple loading for less capable devices
                console.log("Rendering simple loading indicator for:", pendingUrl);
                return (
                    <SimpleLoadingIndicator url={pendingUrl} />
                );
            }
        }

        const activeTab = tabs.find(tab => tab.id === activeTabId);
        if (!activeTab) return null;

        console.log("Rendering content for active tab:", activeTab.url);
        return getCurrentContent(activeTab.url);
    };

    // Get content for a given URL
    const getCurrentContent = (url: string) => {
        if (isLoading && !showConnectionAnimation) {
            return (
                <div className={styles.loadingIndicator}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Loading {url === 'newtab' ? 'new tab' : url}...</div>
                </div>
            );
        }

        if (url === 'newtab') {
            // Home page with paginated speed dials
            return (
                <div className={styles.newtabContent}>
                    <div className={styles.newtabHeader}>
                        <h1 className={styles.newtabTitle}>CYBERACME PORTAL</h1>
                        <div className={styles.newtabSubtitle}>SELECT DESTINATION</div>
                    </div>

                    <SpeedDialGrid sites={sites} />

                    <div className={styles.newtabFooter}>
                        <div className={styles.newtabClock}>
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <NetworkTrafficDisplay />
                    </div>
                </div>
            );
        }

        // Try to find a matching site
        const site = findSite(url);

        if (site) {
            // Check if site is mobile-restricted and we're on a mobile device
            if (isDeviceMobile && site.isMobile === false) {
                return (
                    <div className={styles.mobileRestrictedContent}>
                        <div className={styles.mobileRestrictedIcon}>📵</div>
                        <h2 className={styles.mobileRestrictedTitle}>DESKTOP ACCESS REQUIRED</h2>
                        <p className={styles.mobileRestrictedMessage}>
                            This resource requires a desktop terminal for access.
                            Mobile connections are not authorized for this content.
                        </p>
                    </div>
                );
            }

            // Return the site component
            return site.component;
        } else {
            // For unknown URLs, use an iframe to show Google search results
            const searchUrl = prepareGoogleSearchUrl(url);
            return (
                <div className={styles.iframeContainer}>
                    <div className={styles.greenTintOverlay}></div>
                    <div className={styles.crtOverlay}></div>
                    <div className={styles.scanlines}></div>
                    <div className={styles.glitchOverlay}></div>
                    <iframe
                        src={searchUrl}
                        className={styles.browserIframe}
                        title="External Content"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                </div>
            );
        }
    };

    return (
        <div className={`${styles.browser} ${isDeviceMobile ? styles.mobile : ''}`}>
            <div className={styles.browserHeader}>
                <div className={styles.tabContainer}>
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`${styles.activeTab} ${tab.id === activeTabId ? '' : styles.inactiveTab}`}
                            onClick={() => switchToTab(tab.id)}
                        >
                            <div className={styles.tabTitle}>
                                {tab.url === 'newtab' ? 'New Tab' :
                                    findSite(tab.url)?.name || 'Search: ' + tab.url.substring(0, 15) + (tab.url.length > 15 ? '...' : '')}
                            </div>
                            {tabs.length > 1 && (
                                <button
                                    className={styles.closeTabBtn}
                                    onClick={(e) => closeTab(tab.id, e)}
                                    aria-label="Close tab"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button className={styles.newTabButton} onClick={createNewTab} title="New Tab" aria-label="New tab">
                        +
                    </button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={goBack}
                        disabled={historyIndex <= 0}
                        aria-label="Go back"
                    >
                        ◄
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={goForward}
                        disabled={historyIndex >= history.length - 1}
                        aria-label="Go forward"
                    >
                        ►
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={reload}
                        aria-label="Reload page"
                    >
                        ↺
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={() => navigateTo('newtab')}
                        aria-label="Home"
                    >
                        ⌂
                    </button>
                </div>

                <form className={styles.addressBar} onSubmit={handleSubmit}>
                    <div className={styles.urlInputWrapper}>
                        <div className={styles.urlProtocol}>
                            {isDeviceMobile && !showFullUrl ? '' : 'cyb://'}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={getDisplayUrl()}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={handleUrlFocus}
                            onBlur={handleUrlBlur}
                            className={styles.urlInput}
                            placeholder="Enter address or search"
                            aria-label="Address bar"
                        />
                    </div>
                    <button type="submit" className={styles.goButton} aria-label="Go to address">
                        GO
                    </button>
                </form>
            </div>

            <div className={styles.browserContent}>
                {getTabContent()}
            </div>

            <div className={styles.statusBar}>
                <div className={styles.status}>
                    {isLoading ? 'LOADING...' :
                        showConnectionAnimation ? 'ESTABLISHING CONNECTION...' :
                            currentUrl === 'newtab' ? 'READY' :
                                findSite(currentUrl) ? 'CONNECTED' : 'EXTERNAL NETWORK'}
                </div>
                {/* Show mini version of network traffic in status bar */}
                <div className={styles.securityIndicator}>
                    <div className={styles.miniNetworkDisplay}>
                        {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className={i % 2 === 0 ? styles.miniBarIn : styles.miniBarOut} />
                        ))}
                    </div>
                    <span className={styles.securityText}>
                        {!findSite(currentUrl) && currentUrl !== 'newtab' ? 'EXTERNAL CONNECTION' : 'SECURE CONNECTION'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EnhancedMinimalBrowser;