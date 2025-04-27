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
import dynamicComponents from './utils/dynamicComponents';

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

    // Check if current path is the auth callback
    const isAuthCallback = window.location.pathname.includes('/auth/callback') ||
        window.location.pathname.includes('/discord-callback');

    // Handle auth callback completion
    const handleAuthComplete = (result: { success: boolean; username?: string }) => {
        if (result.success) {
            ToastManager.show({
                type: 'success',
                message: `Logged in as ${result.username}`,
                duration: 3000
            });
        } else {
            ToastManager.show({
                type: 'error',
                message: 'Login failed',
                duration: 3000
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

    // Handle command execution from terminal
    const handleCommand = (program: Program) => {
        launchProgram(program);
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

        // For mobile, we might force fullscreen mode
        const displayMode = isMobile ? 'fullscreen' : program.type;

        if (displayMode === 'window') {
            // Check if window is already open
            const existingWindowIndex = openWindows.findIndex(w => w.id === program.id);

            if (existingWindowIndex >= 0) {
                // Window exists, un-minimize if needed and bring to front
                setOpenWindows(prev =>
                    prev.map((window, index) =>
                        index === existingWindowIndex
                            ? { ...window, minimized: false }
                            : window
                    )
                );
                setActiveWindowId(program.id);
            } else {
                // Open as new window
                setOpenWindows(prev => [
                    ...prev,
                    {
                        id: program.id,
                        title: program.title,
                        component: Component,
                        minimized: false
                    }
                ]);
                setActiveWindowId(program.id);
            }

            // Set focus to the window
            FocusManager.setFocus('window', program.id);
        } else {
            // Handle fullscreen mode (especially for mobile)
            console.log('Launching in fullscreen mode:', program.title);

            // For now, just open as a window
            setOpenWindows(prev => [
                ...prev,
                {
                    id: program.id,
                    title: program.title,
                    component: Component,
                    minimized: false,
                    props: { isFullscreen: true }
                }
            ]);
            setActiveWindowId(program.id);

            // Set focus to the window
            FocusManager.setFocus('window', program.id);
        }
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
            // For files, we can display the content in a window
            const existingWindowIndex = openWindows.findIndex(w => w.id === `file_${item.name}`);

            if (existingWindowIndex >= 0) {
                // Window exists, un-minimize if needed and bring to front
                setOpenWindows(prev =>
                    prev.map((window, index) =>
                        index === existingWindowIndex
                            ? { ...window, minimized: false }
                            : window
                    )
                );
                setActiveWindowId(`file_${item.name}`);
            } else {
                // Open as new window
                try {
                    const content = FileSystem.getFileContent(`${path}`);

                    // Use a simple text viewer component
                    setOpenWindows(prev => [
                        ...prev,
                        {
                            id: `file_${item.name}`,
                            title: item.name,
                            component: dynamicComponents['/components/viewers/TextViewer'],
                            props: { content },
                            minimized: false
                        }
                    ]);
                    setActiveWindowId(`file_${item.name}`);
                } catch (error) {
                    console.error('Error opening file:', error);
                    ToastManager.show({
                        type: 'error',
                        message: `Failed to open file: ${item.name}`,
                        duration: 5000
                    });
                }
            }

            // Set focus to the window
            FocusManager.setFocus('window', `file_${item.name}`);
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
            setActiveWindowId(id);
            FocusManager.setFocus('window', id);
        } else if (activeWindowId === id) {
            // Minimize window if already active
            setOpenWindows(prev =>
                prev.map(w =>
                    w.id === id ? { ...w, minimized: true } : w
                )
            );
            setActiveWindowId(undefined);
            FocusManager.setFocus('terminal');
        } else {
            // Make window active
            setActiveWindowId(id);
            FocusManager.setFocus('window', id);
        }
    };

    // Handle window close
    const handleWindowClose = (id: string) => {
        const windowToClose = openWindows.find(w => w.id === id);
        const windowTitle = windowToClose?.title || 'Window';

        setOpenWindows(prev => prev.filter(w => w.id !== id));

        // If closing the active window, clear active window ID
        if (activeWindowId === id) {
            setActiveWindowId(undefined);

            // Find the next window to focus, or focus terminal if none
            const remainingWindows = openWindows.filter(w => w.id !== id && !w.minimized);
            if (remainingWindows.length > 0) {
                const nextWindow = remainingWindows[remainingWindows.length - 1];
                setActiveWindowId(nextWindow.id);
                FocusManager.setFocus('window', nextWindow.id);
            } else {
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
            setActiveWindowId(undefined);

            // Find the next window to focus, or focus terminal if none
            const remainingWindows = openWindows.filter(w => w.id !== id && !w.minimized);
            if (remainingWindows.length > 0) {
                const nextWindow = remainingWindows[remainingWindows.length - 1];
                setActiveWindowId(nextWindow.id);
                FocusManager.setFocus('window', nextWindow.id);
            } else {
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

        setActiveWindowId(id);
        FocusManager.setFocus('window', id);
    };

    // Handle terminal focus
    const handleTerminalFocus = () => {
        setTerminalVisible(v => !v);
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

    // Calculate the fixed height for the main content area
    // This ensures the home screen doesn't resize when terminal height changes
    const mainContentStyle = {
        height: `calc(100% - 40px - ${terminalVisible ? terminalHeight : 0}px)`,
        transition: 'height 0.2s ease-out'
    };

    // Main application render
    return (
        <div className={styles.app}>
            {/* Background dot pattern */}
            <div className={styles.dotPattern}></div>

            {/* CRT Effects - Always included, with hardware acceleration param */}
            <CrtEffects isHardwareAccelerated={isHardwareAccelerated} />

            {/* Toast Notification Container */}
            <ToastContainer />

            {/* Main content area with HomeScreen and Windows */}
            <div className={styles.mainContent} style={mainContentStyle}>
                {/* HomeScreen - visible when no windows are open */}
                {openWindows.filter(w => !w.minimized).length === 0 && (
                    <HomeScreen />
                )}

                {/* Windows */}
                {openWindows
                    .filter(window => !window.minimized)
                    .map(window => (
                        <Window
                            key={window.id}
                            id={window.id}
                            title={window.title}
                            isActive={activeWindowId === window.id}
                            onClose={() => handleWindowClose(window.id)}
                            onMinimize={() => handleWindowMinimize(window.id)}
                            onMaximize={() => handleWindowMaximize(window.id)}
                            initialMaximized={window.props?.isMaximized}
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
                        bottom: '40px',
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
                onTerminalFocus={handleTerminalFocus}
                activeWindowId={activeWindowId}
            />
        </div>
    );
};

export default App;