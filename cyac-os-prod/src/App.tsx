import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import PowerButton from './components/PowerButton/PowerButton';
import BootSequence from './components/BootSequence/BootSequence';
import Terminal from './components/Terminal/Terminal';
import Window from './components/Window/Window';
import TaskBar from './components/TaskBar/TaskBar';
import QuickMenu from './components/QuickMenu/QuickMenu';
import { CrtEffects } from './components/CrtEffects/CrtEffects';
import { FileSystem } from './services/FileSystem';
import { CommandProcessor } from './services/CommandProcessor';
import { AudioManager } from './services/AudioManager';
import { AuthService } from './services/AuthService';
import { FocusManager } from './services/FocusManager';

// Dynamic component loading - in a real app, these would be imported as needed
import dynamicComponents from './utils/dynamicComponents';

// Interface for open windows
interface OpenWindow {
    id: string;
    title: string;
    component: React.ComponentType<any>;
    props?: any;
    minimized: boolean;
}

const App: React.FC = () => {
    // Application state
    const [powered, setPowered] = useState<boolean>(false);
    const [booted, setBooted] = useState<boolean>(false);
    const [quickMenuOpen, setQuickMenuOpen] = useState<boolean>(false);
    const [crtEffectsEnabled, setCrtEffectsEnabled] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | undefined>('');
    const [isHardwareAccelerated, setIsHardwareAccelerated] = useState<boolean>(true);
    const [, setCommandHistory] = useState<string[]>([]);

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

            // Disable CRT effects automatically if hardware acceleration is off
            setCrtEffectsEnabled(false);
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

    // Handle command execution from terminal
    const handleCommand = async (command: string) => {
        // Process the command
        try {
            const result = await CommandProcessor.processCommand(command, '/home/user');

            // If a program/app should be launched
            if (result.program) {
                launchProgram(result.program);
            }

            // Add to command history
            setCommandHistory(prev => [...prev, command]);
        } catch (error) {
            console.error('Command execution error:', error);
            // Failure handling could be added here
        }
    };

    // Launch a program from quick menu or terminal
    const launchProgram = (program: { id: string; title: string; component: string; type: 'window' | 'fullscreen' }) => {
        // Check if program component exists
        const Component = dynamicComponents[program.component];
        if (!Component) {
            console.error(`Component not found: ${program.component}`);
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
            // In a real app, you might use a different approach for fullscreen apps
            console.log('Launching in fullscreen mode:', program.title);

            // For now, we'll just open as a window
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
        FocusManager.setFocus('terminal');
    };

    // Render power button or boot sequence if not booted yet
    if (!powered) {
        return <PowerButton onPowerOn={handlePowerOn} />;
    }

    if (!booted) {
        return <BootSequence onComplete={handleBootComplete} />;
    }

    // Main application render
    return (
        <div className={styles.app}>
            {/* CRT effects (conditionally rendered based on settings) */}
            {crtEffectsEnabled && <CrtEffects isHardwareAccelerated={isHardwareAccelerated} />}

            {/* Main content area */}
            <div className={styles.mainContent}>
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

                {/* Terminal */}
                <Terminal
                    onCommand={handleCommand}
                    initialHeight={200}
                    allowResize={!isMobile}
                    username={AuthService.getCurrentUser()?.username || 'guest'}
                />
            </div>

            {/* Quick menu (overlay) */}
            <QuickMenu
                isOpen={quickMenuOpen}
                onClose={() => setQuickMenuOpen(false)}
                onNavigate={handleQuickMenuItemClick}
                isMobile={isMobile}
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

            {/* Settings button - floating in corner */}
            <button
                className={styles.settingsButton}
                onClick={() => setCrtEffectsEnabled(prev => !prev)}
                title={crtEffectsEnabled ? "Disable CRT Effects" : "Enable CRT Effects"}
            >
                <span className={styles.settingsIcon}>⚙</span>
                <span className={styles.settingsText}>CRT {crtEffectsEnabled ? 'ON' : 'OFF'}</span>
            </button>
        </div>
    );
};

export default App;