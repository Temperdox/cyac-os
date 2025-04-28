import React from 'react';
import dynamicComponents from '../../../utils/dynamicComponents';

interface ComponentTextViewerProps {
    componentPath: string;
}

/**
 * Component Text Viewer
 * A special TextViewer that loads component-based files
 */
const ComponentTextViewer: React.FC<ComponentTextViewerProps> = ({ componentPath }) => {
    // Get the component using the provided path
    const Component = dynamicComponents[componentPath];

    if (!Component) {
        return (
            <div style={{ color: '#ff3333', padding: '20px' }}>
                Error: Component not found: {componentPath}
            </div>
        );
    }

    // Render the component
    return <Component />;
};

export default ComponentTextViewer;