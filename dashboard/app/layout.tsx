import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MediaRefinery Dashboard</title>
      </head>
      <body>
        <a href="#main" style={{ position: 'absolute', left: -10000, top: 'auto' }}>Skip to main content</a>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          <header style={{ marginBottom: 24 }}>
            <h1>MediaRefinery Dashboard</h1>
          </header>
          <main id="main" role="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
