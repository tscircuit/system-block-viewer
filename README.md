# @tscircuit/system-block-viewer

A React viewer for resolved system block diagrams in Circuit JSON.

```tsx
import { SystemBlockViewer } from "@tscircuit/system-block-viewer"

<SystemBlockViewer
  circuitJson={circuitJson}
  containerStyle={{ height: 600 }}
/>
```

Drag to pan, scroll to zoom around the pointer, drag with one finger to pan,
and pinch with two fingers to zoom. These interactions use the same
`use-mouse-matrix-transform` dependency as `@tscircuit/schematic-viewer`.
There are no zoom buttons. The diagram fits the viewport initially; changing
pages resets the view, while rerendering the current page preserves it.

The page selector appears when Circuit JSON contains more than one system
page. Rendering uses `circuit-to-svg` and the resolved positions, dimensions,
and routes; the viewer does not perform layout.

Props: `circuitJson` (required), `containerStyle`, and `className`.
Give the container a height, or place it inside a parent with a defined height.

Development: `bun install`, `bun start`, `bun test`, `bun run typecheck`,
`bun run build`, and `bun run build:site`.
