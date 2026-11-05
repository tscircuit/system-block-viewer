# @tscircuit/system-block-viewer

A React viewer for resolved system block diagrams in Circuit JSON.

[Live examples](https://system-block-viewer.vercel.app)

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

`circuit-to-svg` and `circuit-json` are peer dependencies with `"*"` ranges,
following the tscircuit convention. Install them in the host application alongside this viewer. The
published viewer imports the host renderer, so RunFrame and the viewer share
the same version, including support for curved routes. They are also development
dependencies here for the standalone examples and tests.

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

Click or tap a block or group to inspect its associated components. The details
show each component's reference designator and manufacturer part number. PCB
subcircuit links include nested groups; an explicit component selection remains
limited to those components.

Pass `onComponentClick` to make component rows actionable:

```tsx
<SystemBlockViewer
  circuitJson={circuitJson}
  onComponentClick={({ source_component_id, refdes }) => {
    // Navigate to this source component in your application's schematic viewer.
    console.log(source_component_id, refdes)
  }}
/>
```

The callback receives `source_component_id`, `pcb_component_id`, `refdes`, and
optional `manufacturer_part_number`. Without a callback, the list is read-only.
Blocks can also be opened with Enter or Space and details closed with Escape.
