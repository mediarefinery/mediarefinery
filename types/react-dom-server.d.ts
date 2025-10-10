declare module 'react-dom/server' {
  // Minimal types used by the test suite for renderToStaticMarkup
  export function renderToStaticMarkup(element: any): string;
}
