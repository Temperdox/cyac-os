// Service for managing toast notifications
export interface ToastMessage {
    id?: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
}

// Singleton for global toast management
class ToastManagerClass {
    private static instance: ToastManagerClass;

    private constructor() {
        // No initialization needed
    }

    public static getInstance(): ToastManagerClass {
        if (!ToastManagerClass.instance) {
            ToastManagerClass.instance = new ToastManagerClass();
        }
        return ToastManagerClass.instance;
    }

    /**
     * Show a toast notification
     * @param toast The toast to show
     */
    public show(toast: ToastMessage): void {
        // Create a new event with the toast data
        const event = new CustomEvent('toast', { detail: toast });
        // Dispatch the event globally
        window.dispatchEvent(event);
    }
}

// Export a singleton instance
export const ToastManager = ToastManagerClass.getInstance();