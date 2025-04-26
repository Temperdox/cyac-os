import React, { useState, useEffect } from 'react';
import styles from './TaskBar.module.css';
/*import { FocusManager } from '../services/FocusManager';*/

interface TaskBarProps {
    items: Array<{
        id: string;
        title: string;
        minimized?: boolean;
    }>;
    onItemClick: (id: string) => void;
    onQuickMenuToggle: () => void;
    onTerminalFocus: () => void;
    onClockClick?: () => void;
    activeWindowId?: string;
}

const TaskBar: React.FC<TaskBarProps> = ({
                                             items,
                                             onItemClick,
                                             onQuickMenuToggle,
                                             onTerminalFocus,
                                             onClockClick,
                                             activeWindowId,
                                         }) => {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    };

    // Handle taskbar item click
    const handleItemClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onItemClick(id);
    };

    // Handle terminal button click
    const handleTerminalButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTerminalFocus();
    };

    // Handle clock button click
    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
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
              <span className={styles.taskButtonIcon}>
                {item.minimized ? '△' : '▢'}
              </span>
                            <span className={styles.taskButtonText}>{item.title}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className={styles.statusSection}>
                <button
                    className={styles.terminalButton}
                    onClick={handleTerminalButtonClick}
                    aria-label="Focus terminal"
                    title="Focus Terminal"
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