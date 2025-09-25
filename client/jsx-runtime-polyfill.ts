import React from "react";

// Polyfill for development environments where JSXDEV helper is not available.
// This provides a fallback that calls React.createElement with the provided args.
// It only covers the basic use-case to avoid runtime crashes in environments
// where the JSX dev runtime helper is missing.

declare global {
  interface Window {
    _jsxDEV?: (...args: any[]) => any;
  }
}

if (typeof window !== "undefined") {
  window._jsxDEV = function _jsxDEV(type: any, props: any, key?: any, ...rest: any[]) {
    // Ignore dev-only arguments and call React.createElement
    return React.createElement(type, props);
  };
}
