import React, {useState, useEffect, useRef, JSX} from 'react';
import styles from './TaskBar.module.css';
import IconRenderer from "../QuickMenu/IconRenderer.tsx";

// Single merged interface for TaskBar props
interface TaskBarProps {
    items: Array<{
        id: string;
        title: string;
        minimized?: boolean;
        icon?: string;
        component?: React.ComponentType<any>;
    }>;
    onItemClick: (id: string) => void;
    onQuickMenuToggle: () => void;
    onTerminalFocus: () => void;
    onClockClick?: () => void;
    activeWindowId?: string;
    isCalendarOpen?: boolean;
    setIsCalendarOpen?: (isOpen: boolean) => void;
    onWindowClose?: (id: string) => void;
}

// Interface for WindowPreview props
interface WindowPreviewProps {
    id: string;
    item: {
        id: string;
        title: string;
        minimized?: boolean;
        component?: React.ComponentType<any>;
    } | undefined;
    position: { left: number; top: number };
    onClose: (id: string) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const TaskBar: React.FC<TaskBarProps> = ({
                                             items,
                                             onItemClick,
                                             onQuickMenuToggle,
                                             onTerminalFocus,
                                             onClockClick,
                                             activeWindowId,
                                             isCalendarOpen,
                                             setIsCalendarOpen,
                                             onWindowClose
                                         }) => {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [previewPos, setPreviewPos] = useState({ left: 0, top: 0 });

    // Define taskBarRef here
    const taskBarRef = useRef<HTMLDivElement>(null);

    // Refs for elements and timers
    const iconsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
    const previewTimeoutRef = useRef<number | null>(null);
    const cancelHoverRef = useRef<number | null>(null);

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

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (previewTimeoutRef.current) {
                window.clearTimeout(previewTimeoutRef.current);
            }
            if (cancelHoverRef.current) {
                window.clearTimeout(cancelHoverRef.current);
            }
        };
    }, []);

    // Update preview position when hoveredId changes
    useEffect(() => {
        if (hoveredId && iconsRef.current[hoveredId]) {
            const rect = iconsRef.current[hoveredId]?.getBoundingClientRect();
            if (rect) {
                setPreviewPos({
                    left: rect.left + rect.width / 2,
                    top: rect.top - 8
                });
            }
        }
    }, [hoveredId]);

    // Add CSS for preview animations to the document
    useEffect(() => {
        // Add keyframes for animation
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            @keyframes previewFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -95%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -100%);
                }
            }
        `;
        document.head.appendChild(styleElement);

        // Clean up on unmount
        return () => {
            if (styleElement && document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    // Function to set ref for buttons
    const setIconRef = (el: HTMLButtonElement | null, id: string) => {
        iconsRef.current[id] = el;
    };

    // Handle quick menu button click
    const handleQuickMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onQuickMenuToggle();
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle taskbar item click
    const handleItemClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onItemClick(id);
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle terminal button click
    const handleTerminalButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTerminalFocus();
        if (isCalendarOpen && setIsCalendarOpen) {
            setIsCalendarOpen(false);
        }
    };

    // Handle clock button click
    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClockClick) {
            onClockClick();
        }
    };

    // Handle hover start with delay - matching your JSX timing of 200ms
    const handleItemHover = (id: string) => {
        // Clear any existing timeouts
        if (previewTimeoutRef.current) {
            window.clearTimeout(previewTimeoutRef.current);
        }
        if (cancelHoverRef.current) {
            window.clearTimeout(cancelHoverRef.current);
        }

        // Set a small delay before showing the preview (200ms)
        previewTimeoutRef.current = window.setTimeout(() => {
            console.log(`Showing preview for ${id}`);
            setHoveredId(id);

            // Position the preview above the taskbar item
            if (iconsRef.current[id]) {
                const rect = iconsRef.current[id]?.getBoundingClientRect();
                if (rect) {
                    setPreviewPos({
                        left: rect.left + rect.width / 2,
                        top: rect.top - 8
                    });
                }
            }
            previewTimeoutRef.current = null;
        }, 200) as unknown as number;
    };

    // Handle hover end with 300ms delay to allow movement to preview
    const handleItemLeave = () => {
        // Clear any existing timeouts
        if (previewTimeoutRef.current) {
            window.clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }

        // Add a delay before hiding to allow mouse to move to preview (300ms)
        cancelHoverRef.current = window.setTimeout(() => {
            setHoveredId(null);
            cancelHoverRef.current = null;
        }, 300) as unknown as number;
    };

    // Handle window close from preview
    const handlePreviewClose = (id: string) => {
        console.log(`Preview close clicked for ${id}`);

        // Clear hover timers
        if (previewTimeoutRef.current) {
            window.clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }
        if (cancelHoverRef.current) {
            window.clearTimeout(cancelHoverRef.current);
            cancelHoverRef.current = null;
        }

        // Tell App to close the window
        if (onWindowClose) {
            onWindowClose(id);
        }

        // Hide the preview popup
        setHoveredId(null);
    };

    // Handle preview mouse enter to prevent hiding
    const handlePreviewMouseEnter = () => {
        // Cancel any pending hide
        if (cancelHoverRef.current) {
            window.clearTimeout(cancelHoverRef.current);
            cancelHoverRef.current = null;
        }
    };

    // Create the WindowPreview component using JSX.Element type
    const renderWindowPreview = (props: WindowPreviewProps): JSX.Element => {
        const { id, item, position, onClose, onMouseEnter, onMouseLeave } = props;

        if (!item) return <></>;

        // Get component if available
        const PreviewContent = item.component;
        const isMinimized = item.minimized;
        const title = item.title;

        return (
            <div
                className={styles.taskbarPreview || "taskbar-preview"}
                style={{
                    position: 'absolute',
                    left: position.left,
                    top: position.top,
                    transform: 'translate(-50%, -100%)',
                    width: '220px',
                    height: '160px',
                    backgroundColor: '#001122',
                    border: '1px solid #33ff33',
                    borderRadius: '4px',
                    boxShadow: '0 0 15px rgba(0, 0, 0, 0.8), 0 0 5px rgba(51, 255, 51, 0.5)',
                    zIndex: 99999,
                    overflow: 'hidden',
                    marginBottom: '10px',
                    animation: 'previewFadeIn 0.15s ease-out'
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {/* Preview header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5px 8px',
                        background: 'linear-gradient(to bottom, #000b66, #00443a)',
                        borderBottom: '1px solid #33ff33',
                        height: '28px'
                    }}
                >
                    <span
                        style={{
                            color: '#33ff33',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                        }}
                    >
                        {title}
                    </span>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff9999',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '0 5px',
                            marginLeft: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '18px',
                            width: '18px',
                            borderRadius: '3px'
                        }}
                        onClick={() => onClose(id)}
                        aria-label="Close window"
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#ff9999';
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Preview content */}
                <div
                    style={{
                        height: 'calc(100% - 28px)',
                        overflow: 'hidden',
                        backgroundColor: '#000000'
                    }}
                >
                    {isMinimized ? (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#33ff33',
                                fontSize: '12px',
                                textAlign: 'center',
                                padding: '10px',
                                background: 'radial-gradient(ellipse at center, #002200 0%, #000900 100%)'
                            }}
                        >
                            <span>Window is minimized</span>
                        </div>
                    ) : PreviewContent ? (
                        <div
                            style={{
                                width: '330%',
                                height: '330%',
                                transform: 'scale(0.3)',
                                transformOrigin: 'top left',
                                pointerEvents: 'none'
                            }}
                        >
                            <PreviewContent
                                isPreview={true}
                                fromPreview={true}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#33ff33',
                                fontSize: '12px',
                                textAlign: 'center',
                                padding: '10px',
                                background: 'radial-gradient(ellipse at center, #002200 0%, #000900 100%)'
                            }}
                        >
                            <span>Preview of {title}</span>
                        </div>
                    )}
                </div>

                {/* Arrow pointing to taskbar item */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        marginLeft: '-8px',
                        width: '0',
                        height: '0',
                        borderWidth: '8px 8px 0',
                        borderStyle: 'solid',
                        borderColor: '#33ff33 transparent transparent'
                    }}
                />
            </div>
        );
    };

    return (
        <div
            ref={taskBarRef}
            className={styles.taskBar}
        >
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
                        ref={(el) => setIconRef(el, item.id)}
                        className={`${styles.taskButton} 
                            ${item.minimized ? styles.minimized : ''} 
                            ${activeWindowId === item.id ? styles.active : ''}`}
                        onClick={(e) => handleItemClick(item.id, e)}
                        onMouseEnter={() => handleItemHover(item.id)}
                        onMouseLeave={handleItemLeave}
                        aria-label={item.title}
                        data-window-id={item.id}
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

            {/* Render the preview component directly using JSX */}
            {hoveredId && renderWindowPreview({
                id: hoveredId,
                item: items.find(item => item.id === hoveredId),
                position: previewPos,
                onClose: handlePreviewClose,
                onMouseEnter: handlePreviewMouseEnter,
                onMouseLeave: handleItemLeave
            })}
        </div>
    );
};

export default TaskBar;