import React from 'react';
import TextViewer from '../TextViewer';

/**
 * MarkdownGuide component
 * Displays the markdown guide documentation
 */
const MarkdownGuide: React.FC = () => {
  const content = "# Markdown Formatting Guide\n\n" +
      "This document demonstrates various markdown features that your TextViewer can render.\n\n" +
      "## Basic Formatting\n\n" +
      "**Bold text** and *italic text* are easy to use in markdown.\n\n" +
      "You can also do ~~strikethrough~~ text with double tildes.\n\n" +
      "## Lists\n\n" +
      "### Unordered Lists\n\n" +
      "- Item one\n" +
      "- Item two\n" +
      "  - Nested item\n" +
      "  - Another nested item\n" +
      "- Item three\n\n" +
      "### Ordered Lists\n\n" +
      "1. First item\n" +
      "2. Second item\n" +
      "3. Third item\n\n" +
      "## Links and Images\n\n" +
      "[Click here for CyberAcme homepage](https://cyberacme.org)\n\n" +
      "## Code Blocks\n\n" +
      "Inline `code` can be added with backticks.\n\n" +
      "```javascript\n" +
      "// A code block\n" +
      "function hello() {\n" +
      "  console.log(\"Hello, CyberAcme OS!\");\n" +
      "}\n" +
      "```\n\n" +
      "## Blockquotes\n\n" +
      "> This is a blockquote. It can span\n" +
      "> multiple lines and is useful for\n" +
      "> highlighting important information.\n\n" +
      "## Tables\n\n" +
      "| Header 1 | Header 2 | Header 3 |\n" +
      "|----------|----------|---------|\n" +
      "| Row 1    | Data     | Data     |\n" +
      "| Row 2    | Data     | Data     |\n" +
      "| Row 3    | Data     | Data     |\n\n" +
      "## Custom Formatting\n\n" +
      "The TextViewer also supports custom formatting tags:\n\n" +
      "[red]This text is red[/red]\n\n" +
      "[blue]This text is blue[/blue]\n\n" +
      "[highlight=yellow]This text has a yellow highlight[/highlight]\n\n" +
      "[u]This text is underlined[/u]\n\n" +
      "[size=20]This text is larger[/size]\n\n" +
      "## Terminal Style Tags\n\n" +
      "The TextViewer preserves terminal formatting:\n\n" +
      "[r]Error: File not found[/r]\n\n" +
      "[g]Success: Operation completed[/g]\n\n" +
      "[y]Warning: Disk space low[/y]\n\n" +
      "[c]Info: System update available[/c]\n\n" +
      "---\n\n" +
      "*This document was created to test TextViewer formatting capabilities*";

  return <TextViewer content={content} />;
};

export default MarkdownGuide;