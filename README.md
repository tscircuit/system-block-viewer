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

## Hosting and releases

Vercel builds the Cosmos examples with `bun run build:site` and serves
`cosmos-export`. The connected GitHub project deploys `main` to production and
creates a preview deployment for pull requests.

The release workflow runs `bun pver release` on `main`, publishes to GitHub
Packages, and checks the public package metadata and tarball through jscdn.
The workflow uses its GitHub token with `contents: write` and `packages: write`;
no npm token is required. Dependencies are installed before the scoped GitHub
Packages registry is configured.

Install a released version from:
`https://jscdn.tscircuit.com/@tscircuit/system-block-viewer/VERSION.tgz`.
