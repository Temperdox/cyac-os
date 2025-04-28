import React from 'react';

// Import components directly for best performance in our case
import CyAcBrowserV1 from '../components/Browser/CyAc_browser_v1';
import TextViewer from '../components/viewers/TextViewer/TextViewer';
import ImageViewer from '../components/viewers/ImageViewer/ImageViewer';
import ComponentTextViewer from '../components/viewers/TextViewer/ComponentTextViewer';

// Import document components - each in their own separate file
import MarkdownGuide from '../components/viewers/TextViewer/docs/MarkDownGuide';
import CyberAcmeOsSystemManual from '../components/viewers/TextViewer/docs/CyberAcmeOsSystemManual';
import TerminalColorFormatter from '../components/viewers/TextViewer/docs/TerminalColorFormatter';

// Create a mapping of component paths to React components
const dynamicComponents: { [key: string]: React.ComponentType<any> } = {
    // Core components
    '/components/Browser/CyAc_browser_v1': CyAcBrowserV1,
    '/components/viewers/TextViewer': TextViewer,
    '/components/viewers/ImageViewer': ImageViewer,
    '/components/viewers/ComponentTextViewer': ComponentTextViewer,

    // Document components - direct React components
    '/components/docs/MarkdownGuide': MarkdownGuide,
    '/components/docs/CyberAcmeOsSystemManual': CyberAcmeOsSystemManual,
    '/components/docs/TerminalColorFormatter': TerminalColorFormatter,

    // Mapping for the TextViewer component paths
    '/components/viewers/TextViewer/Documents/MarkdownGuide':
        (props: any) => <ComponentTextViewer componentPath="/components/docs/MarkdownGuide" {...props} />,
    '/components/viewers/TextViewer/Documents/CyberAcmeOsSystemManual':
        (props: any) => <ComponentTextViewer componentPath="/components/docs/CyberAcmeOsSystemManual" {...props} />,
    '/components/viewers/TextViewer/Documents/TerminalColorFormatter':
        (props: any) => <ComponentTextViewer componentPath="/components/docs/TerminalColorFormatter" {...props} />
};

export default dynamicComponents;