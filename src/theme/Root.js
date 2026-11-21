import React from 'react';

// Mermaid shows a small tooltip when you hover over a diagram node. That code
// uses D3's transition(), which is not always loaded in the browser bundle.
// Loading d3-transition here adds the missing method.
import 'd3-transition';
import { selection } from 'd3-selection';

// Safety net: if transition() is still missing, use a harmless no-op version
// so hovering a diagram never throws an error.
if (typeof selection.prototype.transition !== 'function') {
  selection.prototype.transition = function () {
    return this;
  };
  selection.prototype.duration = function () {
    return this;
  };
}

export default function Root({ children }) {
  return <>{children}</>;
}
