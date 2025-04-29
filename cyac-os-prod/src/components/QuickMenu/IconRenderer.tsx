import React from 'react';

interface IconRendererProps {
    icon: string | undefined;
    defaultIcon: string;
    className?: string;
}

const IconRenderer: React.FC<IconRendererProps> = ({ icon, defaultIcon, className = '' }) => {
    // Check if the icon is undefined or null
    if (!icon) {
        return <span className={className}>{defaultIcon}</span>;
    }

    // Check if the icon is a path to an image (starts with /, ./, http://, or assets/)
    const isImagePath =
        icon.startsWith('/') ||
        icon.startsWith('./') ||
        icon.startsWith('http://') ||
        icon.startsWith('https://') ||
        icon.startsWith('assets/');

    // If it's an image path, render an image
    if (isImagePath) {
        return (
            <img
                src={icon}
                alt="icon"
                className={`${className} icon-image`}
                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
            />
        );
    }

    // Otherwise, treat it as an emoji or text
    return <span className={className}>{icon}</span>;
};

export default IconRenderer;