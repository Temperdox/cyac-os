# How to Create and Add a Site to CyberAcme Browser

This guide will walk you through the process of creating a new site for the CyberAcme Browser. Your site will integrate seamlessly with the browser's cyberpunk aesthetic and properly resize on different devices.

## Table of Contents

1. [Basic Structure](#basic-structure)
2. [Creating Your Site Component](#creating-your-site-component)
3. [Site Data Configuration](#site-data-configuration)
4. [Minimal CSS Styling](#minimal-css-styling)
5. [Mobile Compatibility](#mobile-compatibility)
6. [Adding Your Site to the Browser](#adding-your-site-to-the-browser)
7. [Testing Your Site](#testing-your-site)

## Basic Structure

Each site in CyberAcme Browser consists of two main files:

1. A React component file (e.g., `YourSite.tsx`)
2. A CSS module file (e.g., `YourSite.module.css`)

These files should be placed in a dedicated directory under the `sites` folder:

```
/sites
  /YourSite
    YourSite.tsx
    YourSite.module.css
```

## Creating Your Site Component

Here's a template for your React component file:

```tsx
// YourSite.tsx
import React from 'react';
import styles from './YourSite.module.css';

const YourSite: React.FC = () => {
  return (
    <div className={styles.sitePage}>
      <header className={styles.header}>
        <h1>YOUR SITE NAME</h1>
        <div className={styles.subtitle}>YOUR SITE TAGLINE</div>
      </header>

      <main className={styles.content}>
        {/* Your site content goes here */}
        <div className={styles.section}>
          <h2>Section Title</h2>
          <p>Your content here...</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <div>YOUR SITE NAME • ADDITIONAL INFO</div>
        <div className={styles.statusIndicator}>CONNECTION STATUS</div>
      </footer>
    </div>
  );
};

// Export site data for the browser implementation
export const siteData = {
  id: 'yoursite',         // Unique identifier, used for URL and routing
  name: 'YOUR SITE',      // Display name shown in tabs and speed dial
  url: 'yoursite.cyb',    // URL used to access the site
  isMobile: true,         // Set to true if site is mobile-compatible
  component: <YourSite /> // Your site component
};

export default YourSite;
```

## Site Data Configuration

The `siteData` object is crucial for the browser to recognize and display your site. Here's what each property does:

- `id`: A unique identifier used for routing and URLs (lowercase, no spaces)
- `name`: The display name shown in browser tabs and the speed dial grid
- `url`: The browser URL used to access your site (format: `yoursite.cyb`)
- `isMobile`: A boolean flag indicating if your site is accessible on mobile devices
- `component`: Your React component that renders the site content

## Minimal CSS Styling

Here's a minimal CSS template that integrates with the browser's style:

```css
/* YourSite.module.css */

/* Main container */
.sitePage {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
  background-color: #121212;
  color: #f0f0f0;
  font-family: 'Courier New', monospace;
}

/* Header section */
.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(187, 134, 252, 0.3);
}

.header h1 {
  font-size: 32px;
  color: #bb86fc;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.subtitle {
  color: #03dac6;
  font-size: 14px;
  margin-top: 10px;
  letter-spacing: 1px;
}

/* Main content area */
.content {
  margin-bottom: 40px;
}

.section {
  background-color: rgba(35, 29, 41, 0.7);
  border: 1px solid rgba(187, 134, 252, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.section:hover {
  border-color: rgba(187, 134, 252, 0.5);
  box-shadow: 0 0 15px rgba(187, 134, 252, 0.2);
}

.section h2 {
  color: #bb86fc;
  font-size: 20px;
  margin: 0 0 15px 0;
}

.section p {
  color: #ddd;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
}

/* Footer section */
.footer {
  margin-top: 40px;
  padding-top: 15px;
  border-top: 1px solid rgba(187, 134, 252, 0.2);
  font-size: 12px;
  color: #666;
  text-align: center;
}

.statusIndicator {
  color: #03dac6;
  margin-top: 5px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header h1 {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 12px;
  }
  
  .section {
    padding: 15px;
  }
  
  .section h2 {
    font-size: 18px;
  }
  
  .section p {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .sitePage {
    padding: 10px;
  }
  
  .header {
    margin-bottom: 20px;
    padding-bottom: 15px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 10px;
  }
  
  .section h2 {
    font-size: 16px;
  }
  
  .section p {
    font-size: 12px;
  }
}
```

## Mobile Compatibility

To ensure your site works well on mobile devices:

1. Set `isMobile: true` in your `siteData` export
2. Use responsive CSS with media queries (as shown in the template)
3. Test your layout on different screen sizes
4. Keep text readable on small screens (minimum 12px font size)
5. Ensure touch targets are large enough (minimum 44×44 pixels)

If your site is not suitable for mobile viewing, set `isMobile: false` in your `siteData`. The browser will show a "Desktop Access Required" message when users try to access your site on mobile devices.

## Adding Your Site to the Browser

Once you've created your site files, you need to add them to the browser:

1. Create a directory for your site: `/sites/YourSite/`
2. Add your TSX and CSS files to this directory
3. Update the `sites/index.ts` file to include your site:

```tsx
// sites/index.ts
import { siteData as factionsData } from './Factions/Factions';
import { siteData as propagandaData } from './Propaganda/Propaganda';
import { siteData as infostreamData } from './Infostream/Infostream';
import { siteData as darknetData } from './Darknet/Darknet';
import { siteData as yourSiteData } from './YourSite/YourSite'; // Add this line

// Export all site data in an array
export const SITES = [
  factionsData,
  propagandaData,
  infostreamData,
  darknetData,
  yourSiteData // Add this line
];

// Export individual site data
export { 
  factionsData, 
  propagandaData, 
  infostreamData, 
  darknetData,
  yourSiteData // Add this line
};
```

## Testing Your Site

To test your site:

1. Start the application
2. Navigate to the new tab page
3. Your site should appear in the speed dial grid
4. Click on your site to test navigation
5. Test responsiveness by resizing the browser window
6. If you set `isMobile: true`, test on a mobile device or using browser dev tools in mobile mode

## Advanced Customization

Feel free to extend the basic template with additional features:

- Interactive elements (buttons, toggles, sliders)
- Animations using CSS transitions or keyframes
- Custom fonts (import them in your CSS)
- Dynamic content using React hooks
- Custom themes and color schemes

Just make sure to maintain the cyberpunk aesthetic and responsive design so your site integrates well with the browser.

## Troubleshooting

Common issues and solutions:

- **Site not appearing in speed dial**: Check that you've properly updated the `sites/index.ts` file
- **Styling conflicts**: Ensure your CSS uses module-specific class names
- **Responsive issues**: Test on multiple screen sizes and add media queries as needed
- **Content overflow**: Add appropriate overflow handling in your CSS

---

Remember that all sites should maintain the cyberpunk aesthetic of the browser. Use a dark background, neon accents, and monospace fonts for the best integration.