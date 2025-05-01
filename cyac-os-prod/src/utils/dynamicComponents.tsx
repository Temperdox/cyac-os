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

// Import Game Launcher and games
import GameLauncher from '../components/viewers/GameLauncher';
import TicTacToe from '../components/viewers/GameLauncher/Games/TicTacToe';
import Tetris from "../components/viewers/GameLauncher/Games/Tetris.tsx";
import Snake from "../components/viewers/GameLauncher/Games/Snake.tsx";
import CyberQuest from "../components/viewers/GameLauncher/Games/CyberQuest/CyberQuest";

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
        (props: any) => <ComponentTextViewer componentPath="/components/docs/TerminalColorFormatter" {...props} />,

    // Game Launcher
    '/components/viewers/GameLauncher': (props: any) => (
        <GameLauncher
            onLaunchGame={(game) => {
                // Create a program object from the game and launch it
                const gameProgram = {
                    id: game.id,
                    title: game.title,
                    component: game.component,
                    type: 'window'
                };

                // This will call the launchProgram function from App.tsx
                if (props.onLaunchGame) {
                    props.onLaunchGame(gameProgram);
                }
            }}
            {...props}
        />
    ),

    // Games
    '/components/viewers/GameLauncher/Games/TicTacToe': TicTacToe,
    '/components/viewers/GameLauncher/Games/CyberQuest': CyberQuest,

    // Add placeholder references for other games that will be implemented later
    '/components/viewers/GameLauncher/Games/Tetris': Tetris,
    '/components/viewers/GameLauncher/Games/Snake': Snake,
    '/components/viewers/GameLauncher/Games/Chess':
        () => <div className="placeholder-game">Chess game component is not yet implemented</div>,
    '/components/viewers/GameLauncher/Games/Pong':
        () => <div className="placeholder-game">Pong game component is not yet implemented</div>
};

export default dynamicComponents;