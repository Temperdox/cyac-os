import React, { useEffect, useRef } from 'react';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    cancelButtonText?: string;
    confirmButtonText?: string;
    result?: {
        success: boolean;
        message: string;
    } | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onConfirm,
                                                                 title,
                                                                 children,
                                                                 cancelButtonText = 'Cancel',
                                                                 confirmButtonText = 'Confirm',
                                                                 result = null
                                                             }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside the modal
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContainer} ref={modalRef}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {children}
                </div>

                <div className={styles.modalFooter}>
                    {!result ? (
                        <>
                            <button
                                className={styles.cancelButton}
                                onClick={onClose}
                            >
                                {cancelButtonText}
                            </button>
                            <button
                                className={styles.confirmButton}
                                onClick={onConfirm}
                            >
                                {confirmButtonText}
                            </button>
                        </>
                    ) : (
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;