import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.css';
import { ToastMessage } from '../../services/ToastManager';

// Singleton for global toast management
class ToastEmitter {
    private static instance: ToastEmitter;
    private listeners: ((toast: ToastMessage) => void)[] = [];

    private constructor() {}

    public static getInstance(): ToastEmitter {
        if (!ToastEmitter.instance) {
            ToastEmitter.instance = new ToastEmitter();
        }
        return ToastEmitter.instance;
    }

    public addListener(listener: (toast: ToastMessage) => void): void {
        this.listeners.push(listener);
    }

    public removeListener(listener: (toast: ToastMessage) => void): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    public emit(toast: ToastMessage): void {
        this.listeners.forEach(listener => listener(toast));
    }
}

// Global function to show a toast
export const showToast = (toast: ToastMessage): void => {
    ToastEmitter.getInstance().emit(toast);
};

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<(ToastMessage & { id: string })[]>([]);
    const idCounter = React.useRef(0);

    useEffect(() => {
        const handleToast = (toast: ToastMessage) => {
            const id = toast.id || `toast-${Date.now()}-${idCounter.current++}`;
            setToasts(prev => [...prev, { ...toast, id }]);
        };

        const emitter = ToastEmitter.getInstance();
        emitter.addListener(handleToast);

        return () => {
            emitter.removeListener(handleToast);
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
                    duration={toast.duration}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;