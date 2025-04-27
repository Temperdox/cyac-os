import React, { useEffect } from 'react';
import { ToastMessage } from '../../services/ToastManager';
import styles from './Toast.module.css';

interface ToastProps extends ToastMessage {
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id = '', type, message, duration = 5000, onClose }) => {
    // Auto-close after duration
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    // Get icon based on type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <div className={styles.iconContainer}>
                <span className={styles.icon}>{getIcon()}</span>
            </div>
            <div className={styles.content}>
                <div className={styles.message}>{message}</div>
            </div>
            <button className={styles.closeButton} onClick={() => onClose(id)}>×</button>
        </div>
    );
};

export default Toast;