import React, { useState, useEffect } from 'react';
import EnhancedMinimalBrowser from './CyAc_browser_v1';
import { SITES } from './sites';

interface BrowserContainerProps {
    isMobile?: boolean;
}

const EnhancedBrowserContainer: React.FC<BrowserContainerProps> = ({ isMobile = false }) => {
    const [hasFocus, setHasFocus] = useState<boolean>(false);

    // Handle focus
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            // Check if click was outside browser component
            const browserElement = document.getElementById('retro-browser');
            if (browserElement && !browserElement.contains(e.target as Node)) {
                setHasFocus(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // Log the loaded sites to show they're properly imported
    useEffect(() => {
        console.log('Sites loaded:', SITES.map(site => site.name).join(', '));
    }, []);

    return (
        <div
            id="retro-browser"
            style={{
                width: '100%',
                height: '100%',
                border: hasFocus ? '2px solid #bb86fc' : '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: hasFocus ? '0 0 15px rgba(187, 134, 252, 0.3)' : 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s'
            }}
            onClick={() => setHasFocus(true)}
        >
            <EnhancedMinimalBrowser
                isMobile={isMobile}
                hasKeyboardFocus={hasFocus}
            />
        </div>
    );
};

export default EnhancedBrowserContainer;