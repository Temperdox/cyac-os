import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import './themes/global.css';
import PowerButton from './components/PowerButton/PowerButton';
import BootSequence from './components/BootSequence/BootSequence';
import Terminal from './components/Terminal/Terminal';
import Window from './components/Window/Window';
import TaskBar from './components/TaskBar/TaskBar';
import QuickMenu from './components/QuickMenu/QuickMenu';
import HomeScreen from './components/HomeScreen/HomeScreen';
import CrtEffects from './components/CrtEffects/CrtEffects';
import ToastContainer from './components/Toast/ToastContainer';
import { ToastManager } from './services/ToastManager';
import { FileSystem } from './services/FileSystem';
import { AudioManager } from './services/AudioManager';
import { AuthService } from './services/AuthService';
import { FocusManager } from './services/FocusManager';
import DiscordCallback from './components/auth/DiscordCallback/DiscordCallback';
import dynamicComponents from './utils/dynamicComponents.tsx';

// Interface for open windows
interface OpenWindow {
    id: string;
    title: string;
    component: React.ComponentType<any>;
    props?: any;
    minimized: boolean;
}

// Programs interface
interface Program {
    id: string;
    title: string;
    component: string;
    type: 'window' | 'fullscreen';
}

const App: React.FC = () => {
    // Application state
    const [powered, setPowered] = useState<boolean>(false);
    const [booted, setBooted] = useState<boolean>(false);
    const [quickMenuOpen, setQuickMenuOpen] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | undefined>('');
    const [isHardwareAccelerated, setIsHardwareAccelerated] = useState<boolean>(true);
    const [terminalHeight, setTerminalHeight] = useState<number>(200);
    const [terminalVisible, setTerminalVisible] = useState<boolean>(true);
    const [windowOrder, setWindowOrder] = useState<string[]>([]);

    // Check if current path is the auth callback
    const isAuthCallback = window.location.pathname.includes('/auth/callback') ||
        window.location.pathname.includes('/discord-callback');

    // Handle auth callback completion
    const handleAuthComplete = (result: { success: boolean; username?: string }) => {
        if (result.success) {
            ToastManager.show({
                type: 'success',
                message: `Logged in as ${result.username}`,
                duration: 30000
            });
        } else {
            ToastManager.show({
                type: 'error',
                message: 'Login failed',
                duration: 30000
            });
        }

        // Replace the URL to remove the auth code
        window.history.replaceState({}, document.title, '/');
        window.location.href = '/';
    };

    // Hardware acceleration check
    useEffect(() => {
        // Simple test to check for hardware acceleration
        const canvas = document.createElement('canvas');
        const gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');

        // If WebGL is not available, hardware acceleration is likely disabled
        if (!gl) {
            console.warn('Hardware acceleration appears to be disabled');
            setIsHardwareAccelerated(false);

            // Show warning after a short delay to ensure ToastManager is ready
            setTimeout(() => {
                ToastManager.show({
                    type: 'warning',
                    message: 'Hardware acceleration is disabled. Some visual effects may be limited.',
                    duration: 6000
                });
            }, 1000);
        }
    }, []);

    // Detect mobile devices
    useEffect(() => {
        const checkIsMobile = () => {
            return window.innerWidth < 768 || 'ontouchstart' in window;
        };

        setIsMobile(checkIsMobile());

        const handleResize = () => {
            setIsMobile(checkIsMobile());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize services when powered on
    useEffect(() => {
        if (powered) {
            // Initialize focus manager
            FocusManager.initialize();

            // Initialize file system
            FileSystem.initialize().catch(error => {
                console.error('Failed to initialize file system:', error);
                ToastManager.show({
                    type: 'error',
                    message: 'File system initialization failed. Some features may not work properly.',
                    duration: 5000
                });
            });

            // Initialize authentication service
            AuthService.initialize();
        }
    }, [powered]);

    // Handle power on
    const handlePowerOn = () => {
        setPowered(true);

        // Try to play a power-on sound
        try {
            AudioManager.playSound('powerOn', '/sounds/power-on.mp3', { volume: 0.5 });
        } catch (error) {
            console.warn('Failed to play power-on sound:', error);
        }
    };

    // Handle boot completion
    const handleBootComplete = () => {
        setBooted(true);

        // Set focus to terminal after boot
        setTimeout(() => {
            FocusManager.setFocus('terminal');

            // Welcome toast
            ToastManager.show({
                type: 'info',
                message: 'System booted successfully. Welcome to CyberAcme OS.',
                duration: 5000
            });
        }, 100);
    };

    // Handle quick menu toggle
    const handleQuickMenuToggle = () => {
        setQuickMenuOpen(prev => !prev);

        // Set focus based on menu state
        if (!quickMenuOpen) {
            FocusManager.setFocus('quickMenu');
        } else {
            FocusManager.setFocus('terminal');
        }
    };

    // Handle terminal resize
    const handleTerminalResize = (newHeight: number) => {
        setTerminalHeight(newHeight);
    };

    // Handle terminal toggle
    const handleTerminalToggle = () => {
        setTerminalVisible(prev => !prev);
    };

    // Handle command execution from terminal
    const handleCommand = (program: Program) => {
        launchProgram(program);
    };

    // Bring a window to front of the stack
    const bringToFront = (id: string) => {
        // Update window order by removing the window from its current position
        // and adding it to the end (top of the visual stack)
        setWindowOrder(prev => {
            const newOrder = prev.filter(wId => wId !== id);
            return [...newOrder, id];
        });
    };

    // Handle window focus
    const handleWindowFocus = (id: string) => {
        // Only update if not already the active window
        if (id !== activeWindowId) {
            setActiveWindowId(id);
            FocusManager.setFocus('window', id);
        }

        // Always bring window to front when focused
        bringToFront(id);
    };

    // Launch a program from program object
    const launchProgram = (program: Program) => {
        // Check if program component exists
        const Component = dynamicComponents[program.component];
        if (!Component) {
            console.error(`Component not found: ${program.component}`);
            ToastManager.show({
                type: 'error',
                message: `Failed to launch ${program.title}: Component not found.`,
                duration: 5000
            });
            return;
        }

        // Generate a unique ID for this instance of the program
        const timestamp = new Date().getTime();
        const uniqueId = `${program.id}_${timestamp}`;

        // For mobile, we might force fullscreen mode
        const displayMode = isMobile ? 'fullscreen' : program.type;

        // Create a new window
        const newWindow: OpenWindow = {
            id: uniqueId,
            title: program.title,
            component: Component,
            minimized: false,
            props: displayMode === 'fullscreen' ? { isFullscreen: true } : {}
        };

        // Add the new window to the list of open windows
        setOpenWindows(prev => [...prev, newWindow]);
        setActiveWindowId(uniqueId);

        // Set focus to the window
        FocusManager.setFocus('window', uniqueId);

        // Add to window order (on top)
        setWindowOrder(prev => [...prev, uniqueId]);
    };

    // Handle item click in quick menu
    const handleQuickMenuItemClick = (path: string, item: any) => {
        // Close quick menu on desktop, keep open on mobile
        if (!isMobile) {
            setQuickMenuOpen(false);
        }

        // If it's a program/scene/subscene, launch it
        if (item.type === 'program' || item.type === 'scene' || item.type === 'subscene') {
            launchProgram({
                id: `${item.type}_${item.name}`,
                title: item.description || item.name,
                component: item.component,
                type: 'window'
            });
        } else if (item.type === 'file') {
            try {
                // Check if file has a component path
                if (item.component && dynamicComponents[item.component]) {
                    // Launch using the component directly
                    const ComponentToLaunch = dynamicComponents[item.component];

                    // Generate a unique ID for this file window
                    const timestamp = new Date().getTime();
                    const uniqueId = `file_${item.name}_${timestamp}`;

                    // Create a new window using the component
                    const newWindow: OpenWindow = {
                        id: uniqueId,
                        title: item.name,
                        component: ComponentToLaunch,
                        minimized: false
                    };

                    // Add the window
                    setOpenWindows(prev => [...prev, newWindow]);
                    setActiveWindowId(uniqueId);

                    // Set focus to the window
                    FocusManager.setFocus('window', uniqueId);

                    // Add to window order
                    setWindowOrder(prev => [...prev, uniqueId]);
                } else {
                    // Regular file without component - use content with TextViewer
                    const content = FileSystem.getFileContent(`${path}`);

                    // Check if this is a component-based file (using our special marker)
                    if (content.startsWith('[COMPONENT_FILE:')) {
                        // Extract component path
                        const componentPath = content.substring(16, content.length - 1);

                        // Get the component
                        const ComponentToLaunch = dynamicComponents[componentPath];

                        if (!ComponentToLaunch) {
                            throw new Error(`Component not found: ${componentPath}`);
                        }

                        // Generate a unique ID for this file window
                        const timestamp = new Date().getTime();
                        const uniqueId = `file_${item.name}_${timestamp}`;

                        // Create a new window using the component
                        const newWindow: OpenWindow = {
                            id: uniqueId,
                            title: item.name,
                            component: ComponentToLaunch,
                            minimized: false
                        };

                        // Add the window
                        setOpenWindows(prev => [...prev, newWindow]);
                        setActiveWindowId(uniqueId);

                        // Set focus to the window
                        FocusManager.setFocus('window', uniqueId);

                        // Add to window order
                        setWindowOrder(prev => [...prev, uniqueId]);
                    } else {
                        // Regular text content, use TextViewer
                        const timestamp = new Date().getTime();
                        const uniqueId = `file_${item.name}_${timestamp}`;

                        // Create a new window for the file
                        const newWindow: OpenWindow = {
                            id: uniqueId,
                            title: item.name,
                            component: dynamicComponents['/components/viewers/TextViewer'],
                            props: { content },
                            minimized: false
                        };

                        // Add the new window to the list of open windows
                        setOpenWindows(prev => [...prev, newWindow]);
                        setActiveWindowId(uniqueId);

                        // Set focus to the window
                        FocusManager.setFocus('window', uniqueId);

                        // Add to window order (on top)
                        setWindowOrder(prev => [...prev, uniqueId]);
                    }
                }
            } catch (error) {
                console.error('Error opening file:', error);
                ToastManager.show({
                    type: 'error',
                    message: `Failed to open file: ${item.name}`,
                    duration: 5000
                });
            }
        }
    };

    // Handle taskbar item click
    const handleTaskbarItemClick = (id: string) => {
        const window = openWindows.find(w => w.id === id);

        if (!window) return;

        if (window.minimized) {
            // Restore window
            setOpenWindows(prev =>
                prev.map(w =>
                    w.id === id ? { ...w, minimized: false } : w
                )
            );

            // Set active window
            setActiveWindowId(id);
            FocusManager.setFocus('window', id);

            // Bring window to front
            bringToFront(id);
        } else if (activeWindowId === id) {
            // Minimize window if already active
            setOpenWindows(prev =>
                prev.map(w =>
                    w.id === id ? { ...w, minimized: true } : w
                )
            );

            // Clear active window
            setActiveWindowId(undefined);
            FocusManager.setFocus('terminal');

            // No need to update window order for minimized windows
        } else {
            // Make window active
            setActiveWindowId(id);
            FocusManager.setFocus('window', id);

            // Bring window to front
            bringToFront(id);
        }
    };

    // Handle window close
    const handleWindowClose = (id: string) => {
        const windowToClose = openWindows.find(w => w.id === id);
        const windowTitle = windowToClose?.title || 'Window';

        // Remove window from open windows
        setOpenWindows(prev => prev.filter(w => w.id !== id));

        // Remove from window order
        setWindowOrder(prev => prev.filter(wId => wId !== id));

        // If closing the active window, clear active window ID
        if (activeWindowId === id) {
            // Find the next window to focus based on window order
            const visibleWindows = openWindows.filter(w => !w.minimized && w.id !== id);

            if (visibleWindows.length > 0) {
                // Get the topmost window from window order
                const remainingIds = windowOrder.filter(wId =>
                    wId !== id &&
                    visibleWindows.some(w => w.id === wId)
                );

                if (remainingIds.length > 0) {
                    const topmostId = remainingIds[remainingIds.length - 1];
                    setActiveWindowId(topmostId);
                    FocusManager.setFocus('window', topmostId);
                } else {
                    setActiveWindowId(undefined);
                    FocusManager.setFocus('terminal');
                }
            } else {
                setActiveWindowId(undefined);
                FocusManager.setFocus('terminal');
            }
        }

        console.log(`Closed: ${windowTitle}`);
    };

    // Handle window minimize
    const handleWindowMinimize = (id: string) => {
        setOpenWindows(prev =>
            prev.map(w =>
                w.id === id ? { ...w, minimized: true } : w
            )
        );

        // If minimizing the active window, clear active window ID
        if (activeWindowId === id) {
            // Find the next window to focus based on window order
            const visibleWindows = openWindows.filter(w => !w.minimized && w.id !== id);

            if (visibleWindows.length > 0) {
                // Get the topmost window from window order
                const remainingIds = windowOrder.filter(wId =>
                    wId !== id &&
                    visibleWindows.some(w => w.id === wId)
                );

                if (remainingIds.length > 0) {
                    const topmostId = remainingIds[remainingIds.length - 1];
                    setActiveWindowId(topmostId);
                    FocusManager.setFocus('window', topmostId);
                } else {
                    setActiveWindowId(undefined);
                    FocusManager.setFocus('terminal');
                }
            } else {
                setActiveWindowId(undefined);
                FocusManager.setFocus('terminal');
            }
        }
    };

    // Handle window maximize
    const handleWindowMaximize = (id: string) => {
        // Toggle maximized state by using a prop in component
        setOpenWindows(prev =>
            prev.map(w =>
                w.id === id
                    ? {
                        ...w,
                        props: {
                            ...w.props,
                            isMaximized: w.props?.isMaximized ? !w.props.isMaximized : true
                        }
                    }
                    : w
            )
        );

        // Set as active window
        setActiveWindowId(id);
        FocusManager.setFocus('window', id);

        // Bring to front
        bringToFront(id);
    };

    // If we're on the auth callback page, render the callback component
    if (isAuthCallback) {
        return <DiscordCallback onComplete={handleAuthComplete} />;
    }

    // Render power button or boot sequence if not booted yet
    if (!powered) {
        return <PowerButton onPowerOn={handlePowerOn} />;
    }

    if (!booted) {
        return <BootSequence onComplete={handleBootComplete} />;
    }

    // Calculate available height for content based on terminal visibility
    const contentHeight = `calc(100% - 40px - ${terminalVisible ? terminalHeight : 0}px)`;
    const terminalBottom = 40; // Taskbar height

    // Main application render
    return (
        <div className={styles.app}>
            {/* Background dot pattern */}
            <div className={styles.dotPattern}></div>

            {/* CRT Effects - Always included, with hardware acceleration param */}
            <CrtEffects isHardwareAccelerated={isHardwareAccelerated} />

            {/* Toast Notification Container */}
            <ToastContainer />

            {/* Main content area with HomeScreen */}
            <div
                className={styles.mainContent}
                style={{ height: contentHeight, transition: 'height 0.2s ease' }}
            >
                {/* HomeScreen - always visible */}
                <HomeScreen />

                {/* Windows rendered as overlays */}
                {openWindows
                    .filter(window => !window.minimized)
                    // Sort windows based on their position in the windowOrder array
                    .sort((a, b) => {
                        const aIndex = windowOrder.indexOf(a.id);
                        const bIndex = windowOrder.indexOf(b.id);
                        return aIndex - bIndex; // Lower index renders first (at the bottom)
                    })
                    .map(window => (
                        <Window
                            key={window.id}
                            id={window.id}
                            title={window.title}
                            isActive={activeWindowId === window.id}
                            onClose={() => handleWindowClose(window.id)}
                            onMinimize={() => handleWindowMinimize(window.id)}
                            onMaximize={() => handleWindowMaximize(window.id)}
                            onFocus={() => handleWindowFocus(window.id)}
                            initialMaximized={window.props?.isMaximized}
                            terminalHeight={terminalVisible ? terminalHeight : 0}
                            terminalVisible={terminalVisible}
                        >
                            <window.component {...window.props} />
                        </Window>
                    ))}
            </div>

            {/* Terminal - positioned at bottom with fixed height */}
            {terminalVisible && (
                <div
                    className={styles.terminalContainer}
                    style={{
                        height: `${terminalHeight}px`,
                        position: 'absolute',
                        bottom: `${terminalBottom}px`,
                        left: 0,
                        width: '100%'
                    }}
                >
                    <Terminal
                        onCommand={handleCommand}
                        initialHeight={terminalHeight}
                        onResize={handleTerminalResize}
                        allowResize={!isMobile}
                        username={AuthService.getCurrentUser()?.username || 'guest'}
                    />
                </div>
            )}

            {/* Quick menu (overlay) */}
            <QuickMenu
                isOpen={quickMenuOpen}
                onClose={() => setQuickMenuOpen(false)}
                onNavigate={handleQuickMenuItemClick}
                isMobile={isMobile}
                onMinimizeAll={() => {
                    setOpenWindows(prev => prev.map(w => ({ ...w, minimized: true })));
                    setActiveWindowId(undefined);
                    FocusManager.setFocus('terminal');
                }}
                onCloseAll={() => {
                    setOpenWindows([]);
                    setWindowOrder([]);
                    setActiveWindowId(undefined);
                    FocusManager.setFocus('terminal');
                }}
            />

            {/* Taskbar */}
            <TaskBar
                items={openWindows.map(w => ({
                    id: w.id,
                    title: w.title,
                    minimized: w.minimized
                }))}
                onItemClick={handleTaskbarItemClick}
                onQuickMenuToggle={handleQuickMenuToggle}
                onTerminalFocus={handleTerminalToggle}
                activeWindowId={activeWindowId}
            />
        </div>
    );
};

export default App;