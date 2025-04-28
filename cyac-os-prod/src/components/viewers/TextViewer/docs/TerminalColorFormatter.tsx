import React from 'react';
import TextViewer from '../TextViewer';

/**
 * TerminalColorFormatter component
 * Displays the terminal color formatter documentation
 */
const TerminalColorFormatter: React.FC = () => {
    const content = "# [g]Terminal Color Formatter[/g]\n\n" +
        "A utility for formatting text in terminal applications. This program demonstrates syntax highlighting and code formatting in the TextViewer.\n\n" +
        "## Source Code\n\n" +
        "```javascript\n" +
        "/**\n" +
        " * Terminal Color Formatter\n" +
        " * Utility for formatting text with color codes for terminal display\n" +
        " *\n" +
        " * @author CyberAcme Dev Team\n" +
        " * @version 1.0.3\n" +
        " */\n\n" +
        "class TerminalFormatter {\n" +
        "  constructor() {\n" +
        "    // ANSI color code map\n" +
        "    this.colorCodes = {\n" +
        "      reset: '\\x1b[0m',\n" +
        "      // Text colors\n" +
        "      black: '\\x1b[30m',\n" +
        "      red: '\\x1b[31m',\n" +
        "      green: '\\x1b[32m',\n" +
        "      yellow: '\\x1b[33m',\n" +
        "      blue: '\\x1b[34m',\n" +
        "      magenta: '\\x1b[35m',\n" +
        "      cyan: '\\x1b[36m',\n" +
        "      white: '\\x1b[37m',\n" +
        "      // Background colors\n" +
        "      bgBlack: '\\x1b[40m',\n" +
        "      bgRed: '\\x1b[41m',\n" +
        "      bgGreen: '\\x1b[42m',\n" +
        "      bgYellow: '\\x1b[43m',\n" +
        "      bgBlue: '\\x1b[44m',\n" +
        "      bgMagenta: '\\x1b[45m',\n" +
        "      bgCyan: '\\x1b[46m',\n" +
        "      bgWhite: '\\x1b[47m',\n" +
        "      // Styles\n" +
        "      bold: '\\x1b[1m',\n" +
        "      dim: '\\x1b[2m',\n" +
        "      italic: '\\x1b[3m',\n" +
        "      underline: '\\x1b[4m',\n" +
        "      blink: '\\x1b[5m',\n" +
        "      inverse: '\\x1b[7m',\n" +
        "      hidden: '\\x1b[8m',\n" +
        "      strikethrough: '\\x1b[9m'\n" +
        "    };\n\n" +
        "    // Tag to color mapping\n" +
        "    this.tagMap = {\n" +
        "      'r': this.colorCodes.red,\n" +
        "      'g': this.colorCodes.green,\n" +
        "      'b': this.colorCodes.blue,\n" +
        "      'y': this.colorCodes.yellow,\n" +
        "      'c': this.colorCodes.cyan,\n" +
        "      'm': this.colorCodes.magenta,\n" +
        "      'w': this.colorCodes.white,\n" +
        "      'k': this.colorCodes.black\n" +
        "    };\n" +
        "  }\n\n" +
        "  /**\n" +
        "   * Format text with color codes\n" +
        "   * @param {string} text - Text to format\n" +
        "   * @return {string} - Formatted text with ANSI color codes\n" +
        "   */\n" +
        "  format(text) {\n" +
        "    if (!text) return '';\n\n" +
        "    // Process color tags: [r]red text[/r], [g]green text[/g], etc.\n" +
        "    let formattedText = text.replace(\n" +
        "      /\\[([rgbycmwk])\\](.*?)\\[\\/\\1\\]/g,\n" +
        "      (match, tag, content) => {\n" +
        "        const colorCode = this.tagMap[tag] || '';\n" +
        "        return `${colorCode}${content}${this.colorCodes.reset}`;\n" +
        "      }\n" +
        "    );\n\n" +
        "    // Process style tags\n" +
        "    formattedText = this._processStyleTags(formattedText);\n\n" +
        "    return formattedText;\n" +
        "  }\n\n" +
        "  /**\n" +
        "   * Process style tags like [bold], [u], etc.\n" +
        "   * @private\n" +
        "   * @param {string} text - Text to process\n" +
        "   * @return {string} - Text with style tags processed\n" +
        "   */\n" +
        "  _processStyleTags(text) {\n" +
        "    // Process bold tags: [bold]text[/bold]\n" +
        "    text = text.replace(\n" +
        "      /\\[bold\\](.*?)\\[\\/bold\\]/g,\n" +
        "      `${this.colorCodes.bold}$1${this.colorCodes.reset}`\n" +
        "    );\n\n" +
        "    // Process underline tags: [u]text[/u]\n" +
        "    text = text.replace(\n" +
        "      /\\[u\\](.*?)\\[\\/u\\]/g,\n" +
        "      `${this.colorCodes.underline}$1${this.colorCodes.reset}`\n" +
        "    );\n\n" +
        "    // Process italic tags: [i]text[/i]\n" +
        "    text = text.replace(\n" +
        "      /\\[i\\](.*?)\\[\\/i\\]/g,\n" +
        "      `${this.colorCodes.italic}$1${this.colorCodes.reset}`\n" +
        "    );\n\n" +
        "    // Process strikethrough tags: [s]text[/s]\n" +
        "    text = text.replace(\n" +
        "      /\\[s\\](.*?)\\[\\/s\\]/g,\n" +
        "      `${this.colorCodes.strikethrough}$1${this.colorCodes.reset}`\n" +
        "    );\n\n" +
        "    return text;\n" +
        "  }\n\n" +
        "  /**\n" +
        "   * Convert HTML-like formatting to terminal codes\n" +
        "   * @param {string} html - HTML-formatted text\n" +
        "   * @return {string} - Terminal-formatted text\n" +
        "   */\n" +
        "  htmlToTerminal(html) {\n" +
        "    if (!html) return '';\n\n" +
        "    // Replace common HTML tags with terminal formatting\n" +
        "    let result = html\n" +
        "      .replace(/<b>(.*?)<\\/b>/g, `${this.colorCodes.bold}$1${this.colorCodes.reset}`)\n" +
        "      .replace(/<i>(.*?)<\\/i>/g, `${this.colorCodes.italic}$1${this.colorCodes.reset}`)\n" +
        "      .replace(/<u>(.*?)<\\/u>/g, `${this.colorCodes.underline}$1${this.colorCodes.reset}`)\n" +
        "      .replace(/<s>(.*?)<\\/s>/g, `${this.colorCodes.strikethrough}$1${this.colorCodes.reset}`)\n" +
        "      .replace(/<span style=\"color:\\s*([^\"]+)\">(.*?)<\\/span>/g, (match, color, content) => {\n" +
        "        // Map CSS color names to terminal colors\n" +
        "        const colorMap = {\n" +
        "          'red': this.colorCodes.red,\n" +
        "          'green': this.colorCodes.green,\n" +
        "          'blue': this.colorCodes.blue,\n" +
        "          'yellow': this.colorCodes.yellow,\n" +
        "          'cyan': this.colorCodes.cyan,\n" +
        "          'magenta': this.colorCodes.magenta,\n" +
        "          'white': this.colorCodes.white,\n" +
        "          'black': this.colorCodes.black\n" +
        "        };\n\n" +
        "        const terminalColor = colorMap[color.toLowerCase()] || this.colorCodes.reset;\n" +
        "        return `${terminalColor}${content}${this.colorCodes.reset}`;\n" +
        "      });\n\n" +
        "    return result;\n" +
        "  }\n\n" +
        "  /**\n" +
        "   * Apply syntax highlighting for a specific language\n" +
        "   * @param {string} code - Code to highlight\n" +
        "   * @param {string} language - Programming language\n" +
        "   * @return {string} - Highlighted code\n" +
        "   */\n" +
        "  highlight(code, language = 'javascript') {\n" +
        "    // Basic syntax highlighting for JavaScript\n" +
        "    if (language.toLowerCase() === 'javascript') {\n" +
        "      return this._highlightJavaScript(code);\n" +
        "    }\n\n" +
        "    // Add more language support as needed\n\n" +
        "    // Default: return unmodified code\n" +
        "    return code;\n" +
        "  }\n\n" +
        "  /**\n" +
        "   * Highlight JavaScript code\n" +
        "   * @private\n" +
        "   * @param {string} code - JavaScript code\n" +
        "   * @return {string} - Highlighted code\n" +
        "   */\n" +
        "  _highlightJavaScript(code) {\n" +
        "    // Keywords\n" +
        "    const keywords = [\n" +
        "      'const', 'let', 'var', 'function', 'class', 'extends',\n" +
        "      'return', 'if', 'else', 'for', 'while', 'switch', 'case',\n" +
        "      'break', 'continue', 'new', 'this', 'super', 'import',\n" +
        "      'export', 'try', 'catch', 'throw', 'async', 'await'\n" +
        "    ];\n\n" +
        "    // Apply keyword highlighting\n" +
        "    let highlighted = code;\n\n" +
        "    // Highlight keywords\n" +
        "    for (const keyword of keywords) {\n" +
        "      const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'g');\n" +
        "      highlighted = highlighted.replace(\n" +
        "        regex,\n" +
        "        `${this.colorCodes.cyan}${keyword}${this.colorCodes.reset}`\n" +
        "      );\n" +
        "    }\n\n" +
        "    // Highlight strings\n" +
        "    highlighted = highlighted\n" +
        "      .replace(\n" +
        "        /([\"'])(.*?)\\1/g,\n" +
        "        `${this.colorCodes.green}$1$2$1${this.colorCodes.reset}`\n" +
        "      )\n" +
        "      // Highlight comments (simplified)\n" +
        "      .replace(\n" +
        "        /(\\/\\/.*?)($|\\n)/g,\n" +
        "        `${this.colorCodes.yellow}$1${this.colorCodes.reset}$2`\n" +
        "      )\n" +
        "      .replace(\n" +
        "        /(\\/\\*[\\s\\S]*?\\*\\/)/g,\n" +
        "        `${this.colorCodes.yellow}$1${this.colorCodes.reset}`\n" +
        "      )\n" +
        "      // Highlight numbers\n" +
        "      .replace(\n" +
        "        /\\b(\\d+)\\b/g,\n" +
        "        `${this.colorCodes.magenta}$1${this.colorCodes.reset}`\n" +
        "      );\n\n" +
        "    return highlighted;\n" +
        "  }\n" +
        "}\n\n" +
        "// Example usage:\n" +
        "const formatter = new TerminalFormatter();\n\n" +
        "// Basic formatting\n" +
        "const example1 = formatter.format(\n" +
        "  \"This is [r]red[/r], [g]green[/g], and [b]blue[/b] text.\"\n" +
        ");\n" +
        "console.log(example1);\n\n" +
        "// HTML conversion\n" +
        "const example2 = formatter.htmlToTerminal(\n" +
        "  \"<b>Bold</b> and <i>italic</i> with <span style='color: red'>colored</span> text.\"\n" +
        ");\n" +
        "console.log(example2);\n\n" +
        "// Syntax highlighting\n" +
        "const codeExample = `\n" +
        "function calculateFactorial(n) {\n" +
        "  // Base case\n" +
        "  if (n <= 1) return 1;\n\n" +
        "  // Recursive case\n" +
        "  return n * calculateFactorial(n - 1);\n" +
        "}\n\n" +
        "// Calculate factorial of 5\n" +
        "const result = calculateFactorial(5);\n" +
        "console.log(\"5! =\", result);\n" +
        "`;\n\n" +
        "console.log(formatter.highlight(codeExample));\n\n" +
        "module.exports = TerminalFormatter;\n" +
        "```\n\n" +
        "## How to Use\n\n" +
        "To use this formatter in your CyberAcme OS applications:\n\n" +
        "1. [c]Import the module:[/c]\n\n" +
        "   ```javascript\n" +
        "   const TerminalFormatter = require('./TerminalFormatter');\n" +
        "   const formatter = new TerminalFormatter();\n" +
        "   ```\n\n" +
        "2. [c]Format text with custom tags:[/c]\n\n" +
        "   ```javascript\n" +
        "   const formattedText = formatter.format(\"[g]Success:[/g] Operation completed.\");\n" +
        "   console.log(formattedText);\n" +
        "   ```\n\n" +
        "3. [c]Convert HTML to terminal codes:[/c]\n\n" +
        "   ```javascript\n" +
        "   const terminalText = formatter.htmlToTerminal(\"<b>Important:</b> <span style='color: red'>Error detected</span>\");\n" +
        "   console.log(terminalText);\n" +
        "   ```\n\n" +
        "4. [c]Apply syntax highlighting:[/c]\n\n" +
        "   ```javascript\n" +
        "   const highlightedCode = formatter.highlight(sourceCode, 'javascript');\n" +
        "   console.log(highlightedCode);\n" +
        "   ```\n\n" +
        "---\n\n" +
        "[size=12][g]© 2025 CyberAcme Corporation. All code samples are released under the MIT License.[/g][/size]";

    return <TextViewer content={content} />;
};

export default TerminalColorFormatter;