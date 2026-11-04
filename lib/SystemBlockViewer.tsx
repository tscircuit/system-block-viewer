import { useMemo, useState, type CSSProperties } from "react"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { toString as transformToString } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"

export interface SystemBlockViewerProps {
  circuitJson: CircuitJson
  containerStyle?: CSSProperties
  className?: string
}

// Match schematic-viewer: reserve right-click and Ctrl+left-click for context menus.
const shouldPan = (event: MouseEvent | TouchEvent | WheelEvent) => {
  if (event.type !== "mousedown" || !("button" in event)) return true
  return event.button !== 2 && !(event.button === 0 && event.ctrlKey)
}

/** Display core-resolved System geometry with schematic-viewer gestures. */
export function SystemBlockViewer({
  circuitJson,
  containerStyle,
  className,
}: SystemBlockViewerProps) {
  const pages = circuitJson.filter(
    (record) => record.type === "system_block_page",
  )
  const [selectedPageId, setSelectedPageId] = useState<string>()
  const page =
    pages.find((page) => page.system_block_page_id === selectedPageId) ??
    pages[0]
  const pageId = page?.system_block_page_id
  const imageUrl = useMemo(() => {
    if (!pageId) return undefined
    const svg = convertCircuitJsonToSystemSvg(circuitJson, {
      systemBlockPageId: pageId,
    })
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [circuitJson, pageId])

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 300,
        background: "white",
        color: "#111827",
        ...containerStyle,
      }}
    >
      {!page || !imageUrl ? (
        <div
          role="status"
          style={{ padding: 32, textAlign: "center", color: "#6b7280" }}
        >
          No system diagrams. Add a systemblock.page to your circuit to see it
          here.
        </div>
      ) : (
        <>
          {pages.length > 1 && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 8,
                font: "14px sans-serif",
              }}
            >
              System page
              <select
                aria-label="System page"
                value={pageId}
                onChange={(event) => setSelectedPageId(event.target.value)}
                style={{ padding: 4, color: "#111827", background: "white" }}
              >
                {pages.map((page, index) => (
                  <option
                    key={page.system_block_page_id}
                    value={page.system_block_page_id}
                  >
                    {page.display_name ?? page.name ?? `Page ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <SystemViewport
            key={pageId}
            src={imageUrl}
            name={page.display_name ?? page.name ?? "System diagram"}
          />
        </>
      )}
    </div>
  )
}

function SystemViewport({ src, name }: { src: string; name: string }) {
  const { ref, transform } = useMouseMatrixTransform({ shouldDrag: shouldPan })
  return (
    <div
      ref={ref}
      role="region"
      aria-label="System diagram viewport"
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "none",
      }}
    >
      <img
        src={src}
        alt={name}
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
          transformOrigin: "0 0",
          transform: transformToString(transform),
        }}
      />
    </div>
  )
}
