// Main index file for the browser implementation
import EnhancedBrowserContainer from './BrowserImplementation';
import EnhancedMinimalBrowser from './CyAc_browser_v1';
import NetworkTrafficDisplay from './NetworkTrafficDisplay';

// Export all main components
export {
    EnhancedBrowserContainer,
    EnhancedMinimalBrowser,
    NetworkTrafficDisplay
};

// Default export the container component for easy importing
export default EnhancedBrowserContainer;