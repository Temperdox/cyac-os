import React, { useState, useEffect, useRef } from 'react';
import styles from './CyAc_browser_v1.module.css';
import DOMPurify from 'dompurify';

interface PagePreviewProps {
    url: string;
    onNavigate: (url: string) => void;
}

const PagePreview: React.FC<PagePreviewProps> = ({ url, onNavigate }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [frameError, setFrameError] = useState<boolean>(false);
    const [isXFrameOptionsError, setIsXFrameOptionsError] = useState<boolean>(false);
    const [html, setHtml] = useState<string>('');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [useDirectMethod, setUseDirectMethod] = useState<boolean>(true);
    const [showNotification, setShowNotification] = useState<boolean>(false);
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // List of sites known to block iframe embedding
    const frameBlockedSites = [
        'twitter.com', 'x.com',
        'facebook.com', 'instagram.com',
        'linkedin.com', 'tiktok.com',
        'reddit.com'
    ];

    // Check if a site is known to block iframe embedding
    const isFrameBlockedSite = (siteUrl: string): boolean => {
        try {
            const urlObj = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
            const domain = urlObj.hostname.replace('www.', '');
            return frameBlockedSites.some(site =>
                domain === site || domain.endsWith(`.${site}`)
            );
        } catch {
            return false;
        }
    };

    // Function to show notification
    const showFallbackNotification = (message: string) => {
        setNotificationMessage(message);
        setShowNotification(true);

        // Auto-hide notification after 5 seconds
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        notificationTimeoutRef.current = setTimeout(() => {
            setShowNotification(false);
        }, 5000);
    };

    // Function to fetch HTML content
    const fetchHtmlContent = async () => {
        setIsLoading(true);

        try {
            // Call your worker endpoint to fetch the HTML
            const response = await fetch(`/api/fetch?url=${encodeURIComponent(url)}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const htmlContent = await response.text();
            setHtml(htmlContent);
            setFrameError(false);

            if (isXFrameOptionsError) {
                showFallbackNotification('Content blocked by X-Frame-Options. Using fallback rendering.');
            } else {
                showFallbackNotification('URL blocked iframe embedding. Content may not render correctly.');
            }
        } catch (err) {
            console.error('Error fetching page:', err);
            setFetchError(err instanceof Error ? err.message : 'Failed to load page');
            setFrameError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset states when URL changes and check for frame-blocked sites
    useEffect(() => {
        setIsLoading(true);
        setFrameError(false);
        setIsXFrameOptionsError(false);
        setHtml('');
        setFetchError(null);
        setUseDirectMethod(true); // Start with direct iframe method
        setShowNotification(false);

        // Check if this site is known to block frames
        if (isFrameBlockedSite(url)) {
            setFrameError(true);
            setIsLoading(false);
            return;
        }

        // For direct iframes, we'll handle loading state changes
        const loadingTimeout = setTimeout(() => {
            setIsLoading(false);
        }, 5000); // Fallback timeout in case load event doesn't fire

        return () => {
            clearTimeout(loadingTimeout);
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, [url]);

    // Set up error event listener for the window to catch X-Frame-Options errors
    useEffect(() => {
        if (!useDirectMethod) return;

        const handleWindowError = (event: ErrorEvent) => {
            // Check for X-Frame-Options errors
            const errorMsg = event.message || '';
            const errorString = errorMsg.toString().toLowerCase();

            if (
                errorString.includes('x-frame-options') ||
                errorString.includes('refused to display') ||
                errorString.includes('frame-ancestors') ||
                errorString.includes('chromewebdata')  // This captures Chrome's specific error format
            ) {
                console.log('X-Frame-Options error detected:', errorMsg);
                setIsXFrameOptionsError(true);
                setUseDirectMethod(false);
                fetchHtmlContent();

                // Prevent the error from propagating
                event.preventDefault();
                event.stopPropagation();
            }
        };

        window.addEventListener('error', handleWindowError);

        return () => {
            window.removeEventListener('error', handleWindowError);
        };
    }, [useDirectMethod, url]);

    // Handle iframe load events and errors
    useEffect(() => {
        if (!iframeRef.current || !useDirectMethod) return;

        const handleIframeLoad = () => {
            setIsLoading(false);

            // Try to detect if the iframe loaded successfully
            try {
                const iframe = iframeRef.current;
                // If we can access contentDocument, it's likely not blocked
                if (iframe && iframe.contentDocument) {
                    // Success!
                } else {
                    // If contentDocument is null, it might be blocked
                    setUseDirectMethod(false);
                    fetchHtmlContent();
                }
            } catch (error) {
                // If we can't access contentDocument, it's likely blocked
                console.log('Iframe access error detected');
                setUseDirectMethod(false);
                fetchHtmlContent();
            }
        };

        const handleIframeError = (event: Event) => {
            console.log('Iframe error event detected');

            // Check for specific X-Frame-Options error in console
            const consoleErrors = document.querySelectorAll('div.console-error-level');
            let isFrameOptionsError = false;

            consoleErrors.forEach(error => {
                const errorText = error.textContent || '';
                if (
                    errorText.includes('X-Frame-Options') ||
                    errorText.includes('Refused to display') ||
                    errorText.includes('frame-ancestors')
                ) {
                    isFrameOptionsError = true;
                }
            });

            // When error occurs with direct method, switch to HTML fetch method
            setUseDirectMethod(false);

            if (isFrameOptionsError) {
                setIsXFrameOptionsError(true);
            }

            fetchHtmlContent();

            // Prevent the error from propagating
            event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return true;
        };

        const iframe = iframeRef.current;
        iframe.addEventListener('load', handleIframeLoad);
        iframe.addEventListener('error', handleIframeError as EventListener);

        return () => {
            iframe.removeEventListener('load', handleIframeLoad);
            iframe.removeEventListener('error', handleIframeError as EventListener);
        };
    }, [iframeRef.current, useDirectMethod, url]);

    // Add a message event listener to catch SecurityError messages
    useEffect(() => {
        if (!useDirectMethod) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data && typeof event.data === 'string' &&
                (event.data.includes('SecurityError') ||
                    event.data.includes('X-Frame-Options'))) {
                console.log('Security error message received:', event.data);
                setIsXFrameOptionsError(true);
                setUseDirectMethod(false);
                fetchHtmlContent();
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [useDirectMethod, url]);

    // Handle clicks on links in the iframe content
    useEffect(() => {
        if (!containerRef.current) return;

        const handleClick = (e: MouseEvent) => {
            // Check if the click was on a link
            let target = e.target as HTMLElement;
            while (target && target !== containerRef.current) {
                if (target.tagName === 'A') {
                    e.preventDefault();
                    const href = (target as HTMLAnchorElement).getAttribute('href');
                    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                        // Handle relative URLs
                        let fullUrl = href;
                        if (!href.startsWith('http') && !href.startsWith('//')) {
                            try {
                                // Handle URLs relative to the base URL
                                if (href.startsWith('/')) {
                                    const baseUrl = new URL(url);
                                    fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
                                } else {
                                    // Handle URLs relative to the current path
                                    const baseUrl = new URL(url);
                                    const path = baseUrl.pathname.split('/').slice(0, -1).join('/');
                                    fullUrl = `${baseUrl.protocol}//${baseUrl.host}${path}/${href}`;
                                }
                            } catch (err) {
                                console.error('Error processing URL:', err);
                            }
                        } else if (href.startsWith('//')) {
                            fullUrl = `https:${href}`;
                        }

                        onNavigate(fullUrl);
                    }
                    return;
                }
                target = target.parentElement as HTMLElement;
            }
        };

        containerRef.current.addEventListener('click', handleClick);
        return () => {
            containerRef.current?.removeEventListener('click', handleClick);
        };
    }, [url, onNavigate]);

    // Create a safe iframe srcdoc with sanitized HTML
    const createIframeContent = () => {
        if (!html) return '';

        // Configure DOMPurify
        const config = {
            ADD_TAGS: ['base', 'link', 'style', 'img', 'iframe'],
            ADD_ATTR: ['href', 'src', 'rel', 'type', 'crossorigin', 'integrity'],
            FORBID_TAGS: ['script', 'object', 'embed'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick']
        };

        // Sanitize the HTML
        const sanitizedHtml = DOMPurify.sanitize(html, config);

        // Fix relative URLs
        const fixedHtml = sanitizedHtml.replace(
            /(href|src)=["'](?!http|\/\/|data:|blob:|#)(.*?)["']/gi,
            (match, attr, value) => {
                // If it starts with a slash, it's already from the root
                if (value.startsWith('/')) {
                    try {
                        const baseUrl = new URL(url);
                        return `${attr}="${baseUrl.origin}${value}"`;
                    } catch {
                        return match;
                    }
                }

                // Otherwise it's relative to the current path
                try {
                    const baseUrl = new URL(url);
                    const path = baseUrl.pathname.split('/').slice(0, -1).join('/');
                    return `${attr}="${baseUrl.origin}${path}/${value}"`;
                } catch {
                    return match;
                }
            }
        );

        // Add a base tag to help resolve any remaining relative URLs
        const baseTag = `<base href="${url}">`;

        // Create custom CSS to override styles for our theme
        const customCSS = `
            :root {
                color-scheme: dark;
            }
            body {
                background-color: #121212 !important;
                color: #bb86fc !important;
                font-family: 'Courier New', monospace !important;
                margin: 0;
                padding: 8px;
            }
            a {
                color: #03dac6 !important;
            }
            a:hover {
                color: #bb86fc !important;
            }
            img {
                max-width: 100%;
                height: auto;
                border: 1px solid rgba(187, 134, 252, 0.3);
            }
            h1, h2, h3, h4, h5, h6 {
                color: #bb86fc !important;
            }
            table {
                border-collapse: collapse;
                width: 100%;
            }
            th, td {
                border: 1px solid rgba(187, 134, 252, 0.3);
                padding: 8px;
            }
            th {
                background-color: rgba(35, 29, 41, 0.8);
            }
            tr:nth-child(odd) {
                background-color: rgba(35, 29, 41, 0.5);
            }
        `;

        // Build the complete HTML document
        return `
            <!DOCTYPE html>
            <html>
            <head>
                ${baseTag}
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${customCSS}</style>
            </head>
            <body>
                ${fixedHtml}
            </body>
            </html>
        `;
    };

    // Render simulated content for frame-blocked sites
    const renderFrameBlockedSiteContent = () => {
        // Extract domain for display
        let displayUrl = url;
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            displayUrl = urlObj.hostname;
        } catch {}

        // Identify which site it is
        let siteName = displayUrl;
        if (displayUrl.includes('twitter') || displayUrl.includes('x.com')) {
            siteName = 'Twitter/X';
        } else if (displayUrl.includes('facebook')) {
            siteName = 'Facebook';
        } else if (displayUrl.includes('instagram')) {
            siteName = 'Instagram';
        } else if (displayUrl.includes('linkedin')) {
            siteName = 'LinkedIn';
        } else if (displayUrl.includes('tiktok')) {
            siteName = 'TikTok';
        } else if (displayUrl.includes('reddit')) {
            siteName = 'Reddit';
        }

        return (
            <div className={styles.frameBlockedContainer}>
                <div className={styles.siteLogoPlaceholder}>
                    {siteName === 'Twitter/X' && (
                        <div className={styles.twitterLogo}>𝕏</div>
                    )}
                    {siteName !== 'Twitter/X' && (
                        <div className={styles.genericSiteLogo}>{siteName.charAt(0).toUpperCase()}</div>
                    )}
                </div>
                <h2 className={styles.frameBlockedTitle}>{siteName} Cannot Be Displayed</h2>
                <p className={styles.frameBlockedMessage}>
                    {siteName} prevents embedding their content in browsers like this one for security reasons.
                </p>
                <div className={styles.frameBlockedActions}>
                    <button
                        className={styles.externalLinkButton}
                        onClick={() => window.open(url, '_blank')}
                    >
                        Open In New Tab
                    </button>
                    <button
                        className={styles.homeButton}
                        onClick={() => onNavigate('newtab')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    };

    // Render X-Frame-Options error content
    const renderFrameOptionsErrorContent = () => {
        // Extract domain for display
        let displayUrl = url;
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            displayUrl = urlObj.hostname;
        } catch {}

        return (
            <div className={styles.frameBlockedPage}>
                <div className={styles.errorBanner}>X-FRAME-OPTIONS BLOCKED</div>
                <h2 className={styles.frameBlockedTitle}>{displayUrl}</h2>
                <p className={styles.frameBlockedMessage}>
                    This site prevents embedding in iframes for security reasons.
                    Using fallback rendering mode which may affect functionality.
                </p>
                <div className={styles.frameBlockedActions}>
                    <button
                        className={styles.externalLinkButton}
                        onClick={() => window.open(url, '_blank')}
                    >
                        Open In New Tab
                    </button>
                    <button
                        className={styles.retryButton}
                        onClick={() => {
                            setUseDirectMethod(true);
                            onNavigate(url);
                        }}
                    >
                        Retry
                    </button>
                    <button
                        className={styles.homeButton}
                        onClick={() => onNavigate('newtab')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    };

    // Notification component
    const renderNotification = () => {
        if (!showNotification) return null;

        return (
            <div className={styles.notificationContainer}>
                <div className={styles.notification}>
                    <div className={styles.notificationIcon}>ℹ️</div>
                    <div className={styles.notificationMessage}>{notificationMessage}</div>
                    <button
                        className={styles.notificationClose}
                        onClick={() => setShowNotification(false)}
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.iframeContainer}>
                <div className={styles.greenTintOverlay}></div>
                <div className={styles.crtOverlay}></div>
                <div className={styles.scanlines}></div>
                <div className={styles.glitchOverlay}></div>
                <div className={styles.loadingIndicator}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Loading {url}...</div>
                </div>
            </div>
        );
    }

    // If it's a frame-blocked site, show a custom message
    if (frameError || isFrameBlockedSite(url)) {
        return (
            <div className={styles.iframeContainer}>
                <div className={styles.greenTintOverlay}></div>
                <div className={styles.crtOverlay}></div>
                <div className={styles.scanlines}></div>
                <div className={styles.glitchOverlay}></div>
                {renderFrameBlockedSiteContent()}
            </div>
        );
    }

    // Error state when both methods failed
    if (fetchError && !useDirectMethod) {
        return (
            <div className={styles.iframeContainer}>
                <div className={styles.greenTintOverlay}></div>
                <div className={styles.crtOverlay}></div>
                <div className={styles.scanlines}></div>
                <div className={styles.glitchOverlay}></div>
                <div className={styles.pageError}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.errorTitle}>Error Loading Page</h2>
                    <p className={styles.errorMessage}>{fetchError}</p>
                    <div>
                        <button
                            className={styles.retryButton}
                            onClick={() => {
                                setUseDirectMethod(true);
                                onNavigate(url);
                            }}
                        >
                            Retry
                        </button>
                        <button
                            className={styles.homeButton}
                            onClick={() => onNavigate('newtab')}
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render direct iframe if that's the current method
    if (useDirectMethod) {
        // Make sure the URL has a protocol
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

        return (
            <div className={styles.iframeContainer} ref={containerRef}>
                <div className={styles.greenTintOverlay}></div>
                <div className={styles.crtOverlay}></div>
                <div className={styles.scanlines}></div>
                <div className={styles.glitchOverlay}></div>
                <iframe
                    ref={iframeRef}
                    src={fullUrl}
                    className={styles.browserIframe}
                    title="External Content"
                    sandbox="allow-same-origin allow-forms allow-scripts allow-popups"
                    referrerPolicy="no-referrer"
                    frameBorder="0"
                />
            </div>
        );
    }

    // If we encountered an X-Frame-Options error specifically
    if (isXFrameOptionsError) {
        return (
            <div className={styles.iframeContainer} ref={containerRef}>
                <div className={styles.greenTintOverlay}></div>
                <div className={styles.crtOverlay}></div>
                <div className={styles.scanlines}></div>
                <div className={styles.glitchOverlay}></div>
                {renderNotification()}
                {html ? (
                    <iframe
                        srcDoc={createIframeContent()}
                        className={styles.browserIframe}
                        title="External Content"
                        sandbox="allow-same-origin allow-forms allow-popups"
                        frameBorder="0"
                    />
                ) : (
                    renderFrameOptionsErrorContent()
                )}
            </div>
        );
    }

    // Otherwise render using iframe with srcDoc for content from our API
    return (
        <div className={styles.iframeContainer} ref={containerRef}>
            <div className={styles.greenTintOverlay}></div>
            <div className={styles.crtOverlay}></div>
            <div className={styles.scanlines}></div>
            <div className={styles.glitchOverlay}></div>
            {renderNotification()}
            <iframe
                srcDoc={createIframeContent()}
                className={styles.browserIframe}
                title="External Content"
                sandbox="allow-same-origin allow-forms allow-popups"
                frameBorder="0"
            />
        </div>
    );
};

export default PagePreview;