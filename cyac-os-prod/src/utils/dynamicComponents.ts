import React from 'react';

// Import components directly for best performance in our case
// In a real app with many components, you might use dynamic imports

// Browser component
import CyAcBrowserV1 from '../components/Browser/CyAc_browser_v1';

/*// Game components
import Tetris from '../components/programs/games/Tetris';
import Snake from '../components/programs/games/Snake';

// Animation components
import Matrix from '../components/programs/animations/Matrix';

// Utility components
import Clock from '../components/programs/utilities/Clock';
import Calculator from '../components/programs/utilities/Calculator';*/

// Viewer components
import TextViewer from '../components/viewers/TextViewer/TextViewer';
import ImageViewer from '../components/viewers/ImageViewer/ImageViewer';

// Create a mapping of component paths to React components
const dynamicComponents: { [key: string]: React.ComponentType<any> } = {
    '/components/programs/browser/CyAc_browser_v1': CyAcBrowserV1,
    /*'/components/programs/games/Tetris': Tetris,
    '/components/programs/games/Snake': Snake,
    '/components/programs/animations/Matrix': Matrix,
    '/components/programs/utilities/Clock': Clock,
    '/components/programs/utilities/Calculator': Calculator,*/
    '/components/viewers/TextViewer': TextViewer,
    '/components/viewers/ImageViewer': ImageViewer,
};

export default dynamicComponents;