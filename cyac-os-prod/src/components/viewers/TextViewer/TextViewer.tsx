import React from 'react';
import styles from './TextViewer.module.css';

interface TextViewerProps {
    content: string;
    hasKeyboardFocus?: boolean;
}

const TextViewer: React.FC<TextViewerProps> = ({ content }) => {
    return (
        <div className={styles.textViewer}>
            <pre className={styles.content}>{content}</pre>
        </div>
    );
};

export default TextViewer;