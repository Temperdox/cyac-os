import React, { useEffect, useState, useRef } from 'react';
import { ToastMessage } from '../../services/ToastManager';
import styles from './Toast.module.css';

interface ToastProps extends ToastMessage {
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id = '', type, message, duration = 5000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const toastRef = useRef<HTMLDivElement>(null);

    // Handle toast closing with animation
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Match the duration of the exit animation
    };

    // Auto-close after duration
    useEffect(() => {
        // Set duration as a CSS variable
        if (toastRef.current) {
            toastRef.current.style.setProperty('--duration', `${duration}ms`);
        }

        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration]);

    // Get icon based on type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '!';
            default:
                return 'i';
        }
    };

    return (
        <div
            ref={toastRef}
            className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}
        >
            <div className={styles.iconContainer}>
                <span className={styles.icon}>{getIcon()}</span>
            </div>
            <div className={styles.content}>
                <div className={styles.message}>{message}</div>
            </div>
            <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Close notification"
            >
                ×
            </button>
            <div className={`${styles.progressBar} ${styles.progressAnimate}`} ref={progressRef}></div>
        </div>
    );
};

export default Toast;