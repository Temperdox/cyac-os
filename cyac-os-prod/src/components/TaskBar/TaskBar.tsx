import React, { useState, useEffect } from 'react';
import styles from './TaskBar.module.css';
import IconRenderer from "../QuickMenu/IconRenderer.tsx";
// Removing this import as we'll render the calendar in App.tsx instead
// import RetroCalendar from '../RetroCalendar/RetroCalendar';

interface TaskBarProps {
    items: Array<{
        id: string;
        title: string;
        minimized?: boolean;
        icon?: string;
    }>;
    onItemClick: (id: string) => void;
    onQuickMenuToggle: () => void;
    onTerminalFocus: () => void;
    onClockClick?: () => void;
    activeWindowId?: string;
    // Add these new props to work with App.tsx
    isCalendarOpen?: boolean;
    setIsCalendarOpen?: (isOpen: boolean) => void;
}

const TaskBar: React.FC<TaskBarProps> = ({
                                             items,
                                             onItemClick,
                                             onQuickMenuToggle,
                                             onTerminalFocus,
                                             onClockClick,
                                             activeWindowId,
                                             isCalendarOpen,
                                             setIsCalendarOpen
                                         }) => {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    // We no longer need this local state as we'll use the one from App.tsx
    // const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

    // Update time every second
    useEffect(() => {
        const formatTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };

        // Initial time setup
        setCurrentTime(formatTime());

        // Update time every second
        const interval = setInterval(() => {
            setCurrentTime(formatTime());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Detect device type for hover effects
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Handle quick menu button click
    const handleQuickMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onQuickMenuToggle();
        // Close calendar if open
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle taskbar item click
    const handleItemClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onItemClick(id);
        // Close calendar if open
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle terminal button click
    const handleTerminalButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTerminalFocus();
        // Close calendar if open
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle clock button click
    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Just call the onClockClick prop, which will handle the calendar toggle
        if (onClockClick) {
            onClockClick();
        }
    };

    return (
        <div className={styles.taskBar}>
            <div className={styles.startSection}>
                <button
                    className={styles.quickMenuButton}
                    onClick={handleQuickMenuClick}
                    aria-label="Open quick menu"
                >
                    <span className={styles.buttonIcon}>≡</span>
                    <span className={styles.buttonText}>CYBERACME</span>
                </button>
            </div>

            <div className={styles.taskButtonSection}>
                {items.map((item) => (
                    <button
                        key={item.id}
                        className={`${styles.taskButton} 
                ${item.minimized ? styles.minimized : ''} 
                ${activeWindowId === item.id ? styles.active : ''}`}
                        onClick={(e) => handleItemClick(item.id, e)}
                        onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
                        onMouseLeave={() => !isMobile && setHoveredItem(null)}
                        aria-label={item.title}
                    >
                        <div className={styles.taskButtonContent}>
                            <IconRenderer
                                icon={item.icon}
                                defaultIcon={item.minimized ? '△' : '▢'}
                                className={styles.taskButtonIcon}
                            />
                            <span className={styles.taskButtonText}>{item.title}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className={styles.statusSection}>
                <button
                    className={styles.terminalButton}
                    onClick={handleTerminalButtonClick}
                    aria-label="Toggle terminal"
                    title="Toggle Terminal"
                >
                    <span className={styles.buttonIcon}>⌨</span>
                </button>

                <div className={styles.statusItem}>
                    <div className={styles.statusIndicator}></div>
                    <span>ONLINE</span>
                </div>

                <button
                    className={styles.clockButton}
                    onClick={handleClockClick}
                    aria-label="View clock"
                    title="View current time and date"
                >
                    <span className={styles.clockText}>{currentTime}</span>
                </button>
            </div>

            {/* Calendar popup - Removed from here, will be rendered at the App level */}

            {/* Preview when hovering over a taskbar item (on desktop only) */}
            {!isMobile && hoveredItem && (
                <div className={styles.taskPreview}>
                    <div className={styles.previewTitle}>
                        {items.find(item => item.id === hoveredItem)?.title || 'Window'}
                    </div>
                    <div className={styles.previewContent}>
                        {/* Preview content could be added here */}
                        <div className={styles.previewPlaceholder}>
                            Preview not available
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBar;