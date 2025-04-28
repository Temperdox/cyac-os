import React, { useEffect, useState } from 'react';
import styles from './TextViewer.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register languages for syntax highlighting
SyntaxHighlighter.registerLanguage('javascript', javascript);

interface TextViewerProps {
    content: string;
    hasKeyboardFocus?: boolean;
}

const TextViewer: React.FC<TextViewerProps> = ({ content }) => {
    const [parsedContent, setParsedContent] = useState<string>(content);

    useEffect(() => {
        // Process custom formatting tags
        let processedContent = content;

        // Process colored text with [color]text[/color] syntax
        processedContent = processedContent.replace(
            /\[([a-z]+)](.*?)\[\/\1]/g,
            (_, color, text) => `<span style="color: ${color}">${text}</span>`
        );

        // Process highlighted text with [highlight=color]text[/highlight] syntax
        processedContent = processedContent.replace(
            /\[highlight=([a-z#0-9]+)](.*?)\[\/highlight]/g,
            (_, color, text) => `<span style="background-color: ${color}">${text}</span>`
        );

        // Process font sizes with [size=n]text[/size] syntax
        processedContent = processedContent.replace(
            /\[size=(\d+)](.*?)\[\/size]/g,
            (_, size, text) => `<span style="font-size: ${size}px">${text}</span>`
        );

        // Process underline with [u]text[/u] syntax
        processedContent = processedContent.replace(
            /\[u](.*?)\[\/u]/g,
            (_, text) => `<span style="text-decoration: underline">${text}</span>`
        );

        // Process strikethrough with [s]text[/s] syntax (alternative to markdown ~~text~~)
        processedContent = processedContent.replace(
            /\[s](.*?)\[\/s]/g,
            (_, text) => `<span style="text-decoration: line-through">${text}</span>`
        );

        // Process terminal-style formatting tags
        // [r]red text[/r], [g]green text[/g], [b]blue text[/b], [y]yellow text[/y], [c]cyan text[/c]
        processedContent = processedContent.replace(/\[r](.*?)\[\/r]/g, '<span style="color: #ff3333">$1</span>');
        processedContent = processedContent.replace(/\[g\](.*?)\[\/g\]/g, '<span style="color: #33ff33">$1</span>');
        processedContent = processedContent.replace(/\[b\](.*?)\[\/b\]/g, '<span style="color: #3333ff">$1</span>');
        processedContent = processedContent.replace(/\[y\](.*?)\[\/y\]/g, '<span style="color: #ffff33">$1</span>');
        processedContent = processedContent.replace(/\[c\](.*?)\[\/c\]/g, '<span style="color: #33ffff">$1</span>');

        setParsedContent(processedContent);
    }, [content]);

    // Function to determine if the content is primarily Markdown
    const isMarkdownContent = (text: string): boolean => {
        // Simple heuristic: check for common markdown patterns
        const markdownPatterns = [
            /^#+ /m,         // Headers
            /\[.+\]\(.+\)/,  // Links
            /\*\*.+\*\*/,    // Bold
            /\*.+\*/,        // Italic
            /- .+/m,         // Lists
            /```[\s\S]+```/, // Code blocks
            />\s.+/m,        // Blockquotes
            /\|.+\|.+\|/     // Tables
        ];

        return markdownPatterns.some(pattern => pattern.test(text));
    };

    // Try to detect if content is markdown
    const shouldRenderMarkdown = isMarkdownContent(parsedContent);

    // Custom renderer components for ReactMarkdown
    const components = {
        code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match ? match[1] : 'javascript'}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={styles.inlineCode} {...props}>
                    {children}
                </code>
            );
        }
    };

    return (
        <div className={styles.textViewer}>
            {shouldRenderMarkdown ? (
                <div className={styles.markdownContent}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={components}
                    >
                        {parsedContent}
                    </ReactMarkdown>
                </div>
            ) : (
                <pre
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: parsedContent }}
                />
            )}
        </div>
    );
};

export default TextViewer;