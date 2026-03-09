import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA essentials */}
        <meta name="application-name" content="TeleCare Pro" />
        <meta name="description" content="Online doctor consultations, prescriptions &amp; health records" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="background-color" content="#0F172A" />
        <link rel="manifest" href="/manifest.json" />

        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TeleCare" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />

        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TeleCare Pro" />
        <meta property="og:description" content="Online doctor consultations from anywhere" />
        <meta property="og:image" content="/icons/icon-512.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Expo resets */}
        <ScrollViewStyleReset />

        {/* Base styles: hide scrollbars, full-height app shell */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              body { margin: 0; background-color: #0F172A; overflow: hidden; }
              /* Hide native scrollbars on web — RN handles its own */
              ::-webkit-scrollbar { display: none; }
              * { -webkit-tap-highlight-color: transparent; }
              /* iOS safe-area support */
              body { padding-top: env(safe-area-inset-top); }
            `,
          }}
        />

        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function (reg) {
                      console.log('[TeleCare] SW registered:', reg.scope);
                      // Check for updates every 60s
                      setInterval(function() { reg.update(); }, 60000);
                    })
                    .catch(function (err) {
                      console.warn('[TeleCare] SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
