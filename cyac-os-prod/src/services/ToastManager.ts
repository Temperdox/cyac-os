// Toast notification service
// This manager handles creating, displaying, and removing toast notifications

// Define toast message interface
export interface ToastMessage {
    id?: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number; // Duration in milliseconds
}

// Class that handles toast message queue and DOM manipulation
export class ToastManager {
    private static instance: ToastManager;
    private container: HTMLElement | null = null;
    private toasts: Map<string, { element: HTMLElement, timeoutId: number }> = new Map();
    private defaultDuration = 5000; // 5 seconds
    private counter = 0;

    // Private constructor (singleton pattern)
    private constructor() {
        this.createContainer();
    }

    // Get singleton instance
    private static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager();
        }
        return ToastManager.instance;
    }

    // Create the toast container if it doesn't exist
    private createContainer(): void {
        if (document.getElementById('toast-container')) {
            this.container = document.getElementById('toast-container');
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column-reverse';
        this.container.style.gap = '10px';
        this.container.style.zIndex = '10000';
        this.container.style.pointerEvents = 'none';

        document.body.appendChild(this.container);
    }

    // Generate a unique ID for each toast
    private generateId(): string {
        return `toast-${Date.now()}-${this.counter++}`;
    }

    // Create a toast notification
    private createToast(toast: ToastMessage): HTMLElement {
        const { type, message } = toast;
        const id = toast.id || this.generateId();

        // Create toast element
        const toastElement = document.createElement('div');
        toastElement.id = id;
        toastElement.className = `toast toast-${type}`;

        // Set toast styles
        toastElement.style.padding = '12px 16px';
        toastElement.style.borderRadius = '4px';
        toastElement.style.marginBottom = '10px';
        toastElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        toastElement.style.display = 'flex';
        toastElement.style.alignItems = 'center';
        toastElement.style.justifyContent = 'space-between';
        toastElement.style.minWidth = '300px';
        toastElement.style.maxWidth = '450px';
        toastElement.style.animation = 'toast-in 0.3s ease forwards';
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(20px)';
        toastElement.style.pointerEvents = 'auto';

        // Set different styles based on toast type
        switch (type) {
            case 'success':
                toastElement.style.backgroundColor = 'rgba(0, 128, 0, 0.9)';
                toastElement.style.color = 'white';
                toastElement.style.borderLeft = '4px solid #00ff00';
                break;
            case 'error':
                toastElement.style.backgroundColor = 'rgba(139, 0, 0, 0.9)';
                toastElement.style.color = 'white';
                toastElement.style.borderLeft = '4px solid #ff3333';
                break;
            case 'warning':
                toastElement.style.backgroundColor = 'rgba(128, 64, 0, 0.9)';
                toastElement.style.color = 'white';
                toastElement.style.borderLeft = '4px solid #ffaa33';
                break;
            default: // info
                toastElement.style.backgroundColor = 'rgba(0, 0, 64, 0.9)';
                toastElement.style.color = 'white';
                toastElement.style.borderLeft = '4px solid #33aaff';
        }

        // Create message content
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.flex = '1';

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'inherit';
        closeButton.style.fontSize = '20px';
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.opacity = '0.7';
        closeButton.style.transition = 'opacity 0.2s';
        closeButton.style.padding = '0 5px';

        closeButton.addEventListener('mouseover', () => {
            closeButton.style.opacity = '1';
        });

        closeButton.addEventListener('mouseout', () => {
            closeButton.style.opacity = '0.7';
        });

        closeButton.addEventListener('click', () => {
            ToastManager.remove(id);
        });

        // Assemble the toast
        toastElement.appendChild(messageElement);
        toastElement.appendChild(closeButton);

        // Add animation keyframes if they don't exist yet
        if (!document.getElementById('toast-keyframes')) {
            const style = document.createElement('style');
            style.id = 'toast-keyframes';
            style.textContent = `
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `;
            document.head.appendChild(style);
        }

        return toastElement;
    }

    // Public method to show a toast notification
    public static show(toast: ToastMessage): string {
        const instance = ToastManager.getInstance();

        // Make sure container exists
        if (!instance.container) {
            instance.createContainer();
        }

        // Generate ID if not provided
        const id = toast.id || instance.generateId();
        const duration = toast.duration || instance.defaultDuration;

        // Create toast element
        const toastElement = instance.createToast({
            ...toast,
            id
        });

        // Add toast to container
        if (instance.container) {
            instance.container.appendChild(toastElement);
        }

        // Force reflow to trigger animation
        void toastElement.offsetWidth;

        // Set styles to make it visible
        toastElement.style.opacity = '1';
        toastElement.style.transform = 'translateY(0)';

        // Schedule removal
        const timeoutId = window.setTimeout(() => {
            ToastManager.remove(id);
        }, duration);

        // Store toast reference
        instance.toasts.set(id, { element: toastElement, timeoutId });

        // Return ID for potential later reference
        return id;
    }

    // Remove a toast by ID
    public static remove(id: string): void {
        const instance = ToastManager.getInstance();

        // Find the toast
        const toast = instance.toasts.get(id);
        if (!toast) return;

        // Clear the timeout
        clearTimeout(toast.timeoutId);

        // Animate removal
        toast.element.style.animation = 'toast-out 0.3s ease forwards';

        // Remove after animation completes
        setTimeout(() => {
            if (instance.container?.contains(toast.element)) {
                instance.container.removeChild(toast.element);
            }
            instance.toasts.delete(id);
        }, 300);
    }

    // Remove all toasts
    public static clear(): void {
        const instance = ToastManager.getInstance();

        // Clear all timeouts and remove elements
        instance.toasts.forEach(({ element, timeoutId }) => {
            clearTimeout(timeoutId);
            if (instance.container?.contains(element)) {
                instance.container.removeChild(element);
            }
        });

        // Clear the map
        instance.toasts.clear();
    }
}

export default ToastManager;