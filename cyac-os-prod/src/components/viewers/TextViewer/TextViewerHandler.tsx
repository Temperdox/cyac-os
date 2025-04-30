import React, { useEffect, useState } from 'react';
import TextViewer from './TextViewer';
import ComponentTextViewer from './ComponentTextViewer';

interface TextViewerHandlerProps {
    component: string;
    title: string;
}

/**
 * TextViewerHandler Component
 * Handles opening text files and determines whether to use the standard TextViewer
 * or ComponentTextViewer based on the file properties
 */
const TextViewerHandler: React.FC<TextViewerHandlerProps> = ({ component }) => {
    const [content, setContent] = useState<string>('');
    const [isComponent, setIsComponent] = useState<boolean>(false);
    const [componentPath, setComponentPath] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                setIsLoading(true);

                // If the component path starts with a slash, it's a dynamic component
                if (component.startsWith('/')) {
                    setIsComponent(true);
                    setComponentPath(component);
                } else {
                    // Otherwise, fetch the content as text
                    // This is a simplified example - in a real app, you'd have a service to load files
                    try {
                        // Simulate loading file content
                        // In a real app, this would fetch the content from your file system service
                        const fileContent = "File content would be loaded here";
                        setContent(fileContent);
                        setIsComponent(false);
                    } catch (err) {
                        setError(`Failed to load file: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                }
            } catch (err) {
                setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [component]);

    if (isLoading) {
        return <div>[g]Loading content...[/g]</div>;
    }

    if (error) {
        return <div style={{ color: '#ff3333' }}>{error}</div>;
    }

    // Render the appropriate viewer based on the content type
    return isComponent ? (
        <ComponentTextViewer componentPath={componentPath} />
    ) : (
        <TextViewer content={content} />
    );
};

export default TextViewerHandler;