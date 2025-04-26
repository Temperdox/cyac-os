import React, { useState, useEffect } from 'react';
import styles from './CyAc_browser_v1.module.css';

interface BrowserProps {
    hasKeyboardFocus?: boolean;
    initialUrl?: string;
}

const CyAc_browser_v1: React.FC<BrowserProps> = ({
                                                     hasKeyboardFocus = false,
                                                     initialUrl = 'https://cyberacme.example.com'
                                                 }) => {
    const [url, setUrl] = useState<string>(initialUrl);
    const [inputValue, setInputValue] = useState<string>(initialUrl);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [history, setHistory] = useState<string[]>([initialUrl]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    // Simulate loading when URL changes
    useEffect(() => {
        if (url !== history[historyIndex]) {
            setIsLoading(true);

            // Add to history if navigating forward
            if (historyIndex === history.length - 1) {
                setHistory(prev => [...prev, url]);
                setHistoryIndex(prev => prev + 1);
            } else {
                // Replace history from current point if navigating from a previous point
                setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
                setHistoryIndex(prev => prev + 1);
            }

            // Simulate page loading
            const loadingTime = 500 + Math.random() * 1000; // Random loading time between 0.5-1.5s
            const timeout = setTimeout(() => {
                setIsLoading(false);
            }, loadingTime);

            return () => clearTimeout(timeout);
        }
    }, [url, history, historyIndex]);

    // Update input value when url changes
    useEffect(() => {
        setInputValue(url);
    }, [url]);

    // Handle URL submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Add protocol if missing
        let newUrl = inputValue;
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            newUrl = 'https://' + newUrl;
        }

        setUrl(newUrl);
    };

    // Go back in history
    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setUrl(history[historyIndex - 1]);
        }
    };

    // Go forward in history
    const goForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setUrl(history[historyIndex + 1]);
        }
    };

    // Reload current page
    const reload = () => {
        setIsLoading(true);

        // Simulate reload
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timeout);
    };

    // Handle keyboard shortcuts when the browser has focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle keyboard events when this component has focus
            if (!hasKeyboardFocus) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.altKey) { // Alt+Left Arrow is a common browser shortcut for back
                        e.preventDefault();
                        goBack();
                    }
                    break;
                case 'ArrowRight':
                    if (e.altKey) { // Alt+Right Arrow is a common browser shortcut for forward
                        e.preventDefault();
                        goForward();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) { // Ctrl+R or Cmd+R for refresh
                        e.preventDefault();
                        reload();
                    }
                    break;
                case 'l':
                case 'L':
                    if (e.ctrlKey || e.metaKey) { // Ctrl+L or Cmd+L to focus address bar
                        e.preventDefault();
                        const urlInput = document.querySelector(`.${styles.urlInput}`) as HTMLInputElement;
                        if (urlInput) {
                            urlInput.focus();
                            urlInput.select();
                        }
                    }
                    break;
                case 'Escape':
                    // Cancel loading or blur focused elements
                    if (isLoading) {
                        // Could add a cancel loading feature here
                    } else {
                        if (document.activeElement instanceof HTMLElement &&
                            document.activeElement !== document.body) {
                            document.activeElement.blur();
                        }
                    }
                    break;
            }
        };

        // Add event listener when component mounts or when focus state changes
        document.addEventListener('keydown', handleKeyDown);

        // Remove event listener on cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasKeyboardFocus, goBack, goForward, reload, isLoading]);

    return (
        <div className={styles.browser}>
            <div className={styles.toolbar}>
                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={goBack}
                        disabled={historyIndex <= 0}
                    >
                        ◄
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={goForward}
                        disabled={historyIndex >= history.length - 1}
                    >
                        ►
                    </button>
                    <button
                        className={styles.navButton}
                        onClick={reload}
                    >
                        ↺
                    </button>
                </div>

                <form className={styles.addressBar} onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={styles.urlInput}
                    />
                    <button type="submit" className={styles.goButton}>GO</button>
                </form>
            </div>

            <div className={styles.browserContent}>
                {isLoading ? (
                    <div className={styles.loadingIndicator}>
                        <div className={styles.spinner}></div>
                        <div className={styles.loadingText}>Loading {url}...</div>
                    </div>
                ) : (
                    <div className={styles.pageContent}>
                        <div className={styles.pageHeader}>
                            <h1>CYBERACME WEB PORTAL</h1>
                            <div className={styles.url}>{url}</div>
                        </div>
                        <div className={styles.pageBody}>
                            <div className={styles.section}>
                                <h2>WELCOME TO CYBERACME</h2>
                                <p>THE FUTURE IS OUR CODE</p>
                                <div className={styles.cyacLogo}>
                                    CYBERACME
                                    <div className={styles.tagline}>CYBERNETIC SOLUTIONS FOR A DIGITAL WORLD</div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h2>RECENT ANNOUNCEMENTS</h2>
                                <ul className={styles.announcements}>
                                    <li>System update v3.6.0 released</li>
                                    <li>New quantum computing initiative launched</li>
                                    <li>CyAc Labs announces neural interface prototype</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.statusBar}>
                <div className={styles.status}>
                    {isLoading ? 'Loading...' : 'Ready'}
                </div>
                <div className={styles.securityIndicator}>
                    SECURE CONNECTION
                </div>
            </div>
        </div>
    );
};

export default CyAc_browser_v1;