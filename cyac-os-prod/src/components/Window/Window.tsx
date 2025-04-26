import React, { useState, useRef, useEffect } from 'react';
import styles from './Window.module.css';
import { FocusManager } from '../../services/FocusManager';

interface WindowProps {
    id: string;
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    isActive?: boolean;
    initialPosition?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    initialMaximized?: boolean;
}

const Window: React.FC<WindowProps> = ({
                                           id,
                                           title,
                                           children,
                                           onClose,
                                           onMinimize,
                                           onMaximize,
                                           isActive = false,
                                           initialPosition = { x: 100, y: 100, width: 600, height: 400 },
                                           initialMaximized = false,
                                       }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [maximized, setMaximized] = useState(initialMaximized);
    const [preMaximizedPosition, setPreMaximizedPosition] = useState(initialPosition);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

    const windowRef = useRef<HTMLDivElement>(null);

    // Handle window activation
    useEffect(() => {
        if (isActive) {
            FocusManager.setActiveWindow(id);
        }
    }, [isActive, id]);

    // Handle click on window to bring it to front
    const handleWindowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        FocusManager.setActiveWindow(id);
    };

    // Start dragging the window
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if (maximized) return;

        // Don't drag if clicking on buttons
        if ((e.target as HTMLElement).closest(`.${styles.windowControl}`)) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });

        // Set focus to window
        FocusManager.setActiveWindow(id);
    };

    // Start resizing the window
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (maximized) return;

        e.stopPropagation();
        e.preventDefault();

        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
        });

        // Set focus to window
        FocusManager.setActiveWindow(id);
    };

    // Handle mouse movement for dragging and resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, e.clientX - dragStart.x);
                const newY = Math.max(0, e.clientY - dragStart.y);

                setPosition(prev => ({
                    ...prev,
                    x: newX,
                    y: newY,
                }));
            } else if (isResizing) {
                const newWidth = Math.max(300, position.width + (e.clientX - resizeStart.x));
                const newHeight = Math.max(200, position.height + (e.clientY - resizeStart.y));

                setPosition(prev => ({
                    ...prev,
                    width: newWidth,
                    height: newHeight,
                }));

                setResizeStart({
                    x: e.clientX,
                    y: e.clientY,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging/resizing
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging, isResizing, dragStart, resizeStart, position, maximized]);

    // Toggle maximize
    const handleMaximize = () => {
        if (!maximized) {
            setPreMaximizedPosition(position);
            setMaximized(true);
        } else {
            setPosition(preMaximizedPosition);
            setMaximized(false);
        }

        if (onMaximize) onMaximize();
    };

    // Calculate window style based on state
    const getWindowStyle = () => {
        if (maximized) {
            return {
                position: 'fixed' as const,
                top: 0,
                left: 0,
                width: '100%',
                // Preserve space for the terminal at the bottom
                height: 'calc(100% - 250px)', // Adjust this value if needed
                zIndex: isActive ? 1000 : 999,
            };
        }

        return {
            position: 'absolute' as const,
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
            zIndex: isActive ? 1000 : 999,
        };
    };

    return (
        <div
            className={`${styles.window} ${maximized ? styles.maximized : ''} ${isActive ? styles.active : ''}`}
            style={getWindowStyle()}
            ref={windowRef}
            onClick={handleWindowClick}
            data-window-id={id}
        >
            <div
                className={styles.windowHeader}
                onMouseDown={handleHeaderMouseDown}
                onDoubleClick={handleMaximize}
            >
                <div className={styles.windowTitle}>{title}</div>
                <div className={styles.windowControls}>
                    <button
                        className={`${styles.windowControl} ${styles.windowMinimize}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onMinimize) onMinimize();
                        }}
                        aria-label="Minimize"
                    >
                        <span>_</span>
                    </button>
                    <button
                        className={`${styles.windowControl} ${styles.windowMaximize}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMaximize();
                        }}
                        aria-label="Maximize"
                    >
                        <span>{maximized ? '❐' : '□'}</span>
                    </button>
                    <button
                        className={`${styles.windowControl} ${styles.windowClose}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onClose) onClose();
                        }}
                        aria-label="Close"
                    >
                        <span>×</span>
                    </button>
                </div>
            </div>
            <div className={styles.windowContent}>
                {children}
            </div>
            {!maximized && (
                <div
                    className={styles.windowResizeHandle}
                    onMouseDown={handleResizeMouseDown}
                ></div>
            )}
        </div>
    );
};

export default Window;