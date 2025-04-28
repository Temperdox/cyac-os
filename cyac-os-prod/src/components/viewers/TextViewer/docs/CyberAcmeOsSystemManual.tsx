import React from 'react';
import TextViewer from '../TextViewer';

/**
 * CyberAcmeOsSystemManual component
 * Displays the system manual documentation
 */
const CyberAcmeOsSystemManual: React.FC = () => {
    const content = "# [size=24][highlight=#222][c]CyberAcme OS v3.6.0[/c][/highlight][/size]\n\n" +
        "## [g]SYSTEM REFERENCE MANUAL[/g]\n\n" +
        "[y]DOCUMENT ID:[/y] SYS-MAN-3.6.0\n\n" +
        "[y]REVISION:[/y] A\n\n" +
        "[y]DATE:[/y] 04/28/2025\n\n" +
        "---\n\n" +
        "## [size=18][green]Table of Contents[/green][/size]\n\n" +
        "1. [System Overview](#1-system-overview)\n\n" +
        "2. [Terminal Commands](#2-terminal-commands)\n\n" +
        "3. [File System Structure](#3-file-system-structure)\n\n" +
        "4. [Programs & Applications](#4-programs--applications)\n\n" +
        "5. [User Authentication](#5-user-authentication)\n\n" +
        "6. [Troubleshooting](#6-troubleshooting)\n\n" +
        "---\n\n" +
        "## 1. System Overview\n\n" +
        "CyberAcme OS is a terminal-based operating system with a graphical interface overlay. It combines the power of command-line operations with the convenience of windowed applications.\n\n" +
        "[r]WARNING: Unauthorized access to this system is prohibited.[/r]\n\n" +
        "### 1.1 System Requirements\n\n" +
        "| Component | Minimum | Recommended |\n" +
        "|-----------|---------|-------------|\n" +
        "| Processor | 1.0 GHz | 2.4 GHz     |\n" +
        "| Memory    | 512 MB  | 4 GB        |\n" +
        "| Graphics  | Basic   | Hardware Accelerated |\n" +
        "| Browser   | HTML5 Compatible | Chrome/Firefox Latest |\n\n" +
        "### 1.2 System Architecture\n\n" +
        "```\n" +
        "┌───────────────────────────────────┐\n" +
        "│ APPLICATION LAYER                 │\n" +
        "│  ┌───────┐ ┌────────┐ ┌─────────┐ │\n" +
        "│  │Browser│ │Terminal│ │Utilities│ │\n" +
        "│  └───────┘ └────────┘ └─────────┘ │\n" +
        "├───────────────────────────────────┤\n" +
        "│ WINDOW MANAGEMENT SYSTEM          │\n" +
        "├───────────────────────────────────┤\n" +
        "│ FILE SYSTEM                       │\n" +
        "├───────────────────────────────────┤\n" +
        "│ AUTHENTICATION SERVICES           │\n" +
        "└───────────────────────────────────┘\n" +
        "```\n\n" +
        "## 2. Terminal Commands\n\n" +
        "The terminal provides a command-line interface to interact with the system.\n\n" +
        "### 2.1 Basic Commands\n\n" +
        "| Command | Description | Usage |\n" +
        "|---------|-------------|-------|\n" +
        "| [g]ls[/g] | List directory contents | `ls [directory]` |\n" +
        "| [g]cd[/g] | Change directory | `cd [directory]` |\n" +
        "| [g]cat[/g] | Display file contents or launch programs | `cat [file or program]` |\n" +
        "| [g]pwd[/g] | Print working directory | `pwd` |\n" +
        "| [g]echo[/g] | Display text | `echo [text]` |\n" +
        "| [g]clear[/g] | Clear terminal screen | `clear` |\n" +
        "| [g]help[/g] | Display help information | `help [command]` |\n\n" +
        "### 2.2 Advanced Commands\n\n" +
        "```\n" +
        "mkdir - Create a new directory\n" +
        "touch - Create a new file\n" +
        "rm    - Remove a file or directory\n" +
        "login - Log in to the system\n" +
        "logout - Log out from the system\n" +
        "whoami - Display current user information\n" +
        "```\n\n" +
        "## 3. File System Structure\n\n" +
        "The file system is organized in a hierarchical structure:\n\n" +
        "[highlight=#333]/[/highlight] (Root)\n\n" +
        "├── [highlight=#333]/home[/highlight]\n\n" +
        "│   └── [highlight=#333]/home/user[/highlight] (User home directory)\n\n" +
        "│       ├── [highlight=#333]/home/user/documents[/highlight]\n\n" +
        "│       └── [highlight=#333]/home/user/programs[/highlight]\n\n" +
        "│           ├── [highlight=#333]/home/user/programs/browser[/highlight]\n\n" +
        "│           ├── [highlight=#333]/home/user/programs/games[/highlight]\n\n" +
        "│           ├── [highlight=#333]/home/user/programs/utilities[/highlight]\n\n" +
        "│           └── [highlight=#333]/home/user/programs/animations[/highlight]\n\n" +
        "└── [highlight=#333]/sys[/highlight] (System files)\n\n" +
        "│   └── [highlight=#333]/sys/config[/highlight]\n\n" +
        "## 4. Programs & Applications\n\n" +
        "### 4.1 Launching Programs\n\n" +
        "Programs can be launched using the `cat` command:\n\n" +
        "```\n" +
        "cat programs/browser/CyAc_browser_v1\n" +
        "```\n\n" +
        "Or through the Quick Menu interface.\n\n" +
        "### 4.2 Available Programs\n\n" +
        "| Program | Description | Location |\n" +
        "|---------|-------------|----------|\n" +
        "| CyAc Browser | Web browser | /programs/browser/CyAc_browser_v1 |\n" +
        "| Tetris | Classic game | /programs/games/tetris |\n" +
        "| Matrix Animation | Visual effect | /programs/animations/matrix |\n" +
        "| Calculator | Simple calculator | /programs/utilities/calculator |\n" +
        "| Clock | Digital clock | /programs/utilities/clock |\n\n" +
        "## 5. User Authentication\n\n" +
        "### 5.1 Login Process\n\n" +
        "[u]Users can authenticate through the following methods:[/u]\n\n" +
        "1. Terminal login command\n\n" +
        "   ```\n" +
        "   login\n" +
        "   ```\n\n" +
        "2. Discord OAuth authentication\n\n" +
        "   - Secure authentication through Discord\n\n" +
        "   - Preserves user identity across sessions\n\n" +
        "### 5.2 Security Levels\n\n" +
        "| Level | Access | Description |\n" +
        "|-------|--------|-------------|\n" +
        "| 0 | Guest | Limited access to system resources |\n" +
        "| 1 | User | Standard user privileges |\n" +
        "| 2 | Admin | Administrative access |\n" +
        "| 3 | Root | Complete system access |\n\n" +
        "## 6. Troubleshooting\n\n" +
        "### 6.1 Common Issues\n\n" +
        "[r]ERROR: Command not found[/r]\n\n" +
        "- Check command spelling\n\n" +
        "- Ensure proper syntax\n\n" +
        "[r]ERROR: Permission denied[/r]\n\n" +
        "- Check user authentication status\n\n" +
        "- Verify access level requirements\n\n" +
        "[r]ERROR: File not found[/r]\n\n" +
        "- Verify file path and name\n\n" +
        "- Check current directory location\n\n" +
        "### 6.2 System Recovery\n\n" +
        "If the system becomes unresponsive:\n\n" +
        "1. Press the power button to restart\n\n" +
        "2. During boot sequence, press `ESC` to enter recovery mode\n\n" +
        "3. Select \"Restore Default Configuration\"\n\n" +
        "---\n\n" +
        "[size=14][c]© 2025 CyberAcme Corporation. All rights reserved.[/c][/size]\n\n" +
        "[size=12][c]CONFIDENTIAL - INTERNAL USE ONLY[/c][/size]";

    return <TextViewer content={content} />;
};

export default CyberAcmeOsSystemManual;