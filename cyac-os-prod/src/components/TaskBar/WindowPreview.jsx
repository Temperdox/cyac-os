import React from 'react';
import style from "./WindowPreview.module.css"

/**
 * WindowPreview Component
 * Displays a preview of a window when hovering over a taskbar item
 */
const WindowPreview = ({
                           id,
                           item,
                           position,
                           onClose,
                           onMouseEnter,
                           onMouseLeave
                       }) => {
    if (!item) return null;

    // Get component if available
    const PreviewContent = item.component;
    const isMinimized = item.minimized;
    const title = item.title;

    // Handle close button click
    const handleCloseClick = (e) => {
        e.stopPropagation();
        onClose(id);
    };

    return (
        <div
            className="taskbar-preview"
            style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -100%)',
                width: '220px',
                height: '160px',
                backgroundColor: '#001122',
                border: '1px solid #33ff33',
                borderRadius: '4px',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.8), 0 0 5px rgba(51, 255, 51, 0.5)',
                zIndex: 99999,
                overflow: 'hidden',
                marginBottom: '10px',
                animation: 'previewFadeIn 0.15s ease-out'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Preview header */}
            <div
                className="preview-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 8px',
                    background: 'linear-gradient(to bottom, #000b66, #00443a)',
                    borderBottom: '1px solid #33ff33',
                    height: '28px'
                }}
            >
                <span
                    className="preview-title"
                    style={{
                        color: '#33ff33',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1
                    }}
                >
                    {title}
                </span>
                <button
                    className="preview-close-btn"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff9999',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: '0 5px',
                        marginLeft: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '18px',
                        width: '18px',
                        borderRadius: '3px'
                    }}
                    onClick={handleCloseClick}
                    aria-label="Close window"
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ff9999';
                    }}
                >
                    ×
                </button>
            </div>

            {/* Preview content */}
            <div
                className="preview-content"
                style={{
                    height: 'calc(100% - 28px)',
                    overflow: 'hidden',
                    backgroundColor: '#000000'
                }}
            >
                {isMinimized ? (
                    <div
                        className="preview-placeholder"
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#33ff33',
                            fontSize: '12px',
                            textAlign: 'center',
                            padding: '10px',
                            background: 'radial-gradient(ellipse at center, #002200 0%, #000900 100%)'
                        }}
                    >
                        <span>Window is minimized</span>
                    </div>
                ) : PreviewContent ? (
                    <div
                        className="preview-actual-content"
                        style={{
                            width: '330%',
                            height: '330%',
                            transform: 'scale(0.3)',
                            transformOrigin: 'top left',
                            pointerEvents: 'none'
                        }}
                    >
                        <PreviewContent
                            isPreview={true}
                            fromPreview={true}
                        />
                    </div>
                ) : (
                    <div
                        className="preview-placeholder"
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#33ff33',
                            fontSize: '12px',
                            textAlign: 'center',
                            padding: '10px',
                            background: 'radial-gradient(ellipse at center, #002200 0%, #000900 100%)'
                        }}
                    >
                        <span>Preview of {title}</span>
                    </div>
                )}
            </div>

            {/* Arrow pointing to taskbar item */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    marginLeft: '-8px',
                    width: '0',
                    height: '0',
                    borderWidth: '8px 8px 0',
                    borderStyle: 'solid',
                    borderColor: '#33ff33 transparent transparent'
                }}
            />
        </div>
    );
};

export default WindowPreview;