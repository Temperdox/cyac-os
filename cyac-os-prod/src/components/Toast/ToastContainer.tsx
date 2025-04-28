import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.css';
import { ToastMessage } from '../../services/ToastManager';

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<(ToastMessage & { id: string })[]>([]);
    const idCounter = React.useRef(0);

    // Add sound effect for toasts
    const playToastSound = (type: string) => {
        try {
            const soundFile = type === 'error'
                ? '/sounds/error.mp3'
                : type === 'warning'
                    ? '/sounds/warning.mp3'
                    : '/sounds/notification.mp3';

            const audio = new Audio(soundFile);
            audio.volume = 0.4;
            audio.play().catch(err => console.warn('Could not play toast sound', err));
        } catch (error) {
            console.warn('Failed to play toast sound:', error);
        }
    };

    useEffect(() => {
        const handleToast = (event: Event) => {
            const toast = (event as CustomEvent<ToastMessage>).detail;

            // Generate a unique ID if none provided
            const id = toast.id || `toast-${Date.now()}-${idCounter.current++}`;

            // Limit to 5 visible toasts at a time
            setToasts(prev => {
                // If we have too many toasts, remove the oldest ones
                const newToasts = [...prev, { ...toast, id }];
                if (newToasts.length > 5) {
                    return newToasts.slice(newToasts.length - 5);
                }
                return newToasts;
            });

            // Play sound effect
            playToastSound(toast.type);
        };

        // Listen for toast events
        window.addEventListener('toast', handleToast);

        return () => {
            window.removeEventListener('toast', handleToast);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <div className={styles.container}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    duration={toast.duration || 5000}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;