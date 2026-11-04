import { useMemo, useState, useRef, type CSSProperties } from "react"
import type {
  CircuitJson,
  SystemBlockPage,
  SystemBlockComponent,
  SystemBlockGroup,
} from "circuit-json"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { toString as transformToString } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"

import {
  getAssociatedComponents,
  type SystemBlockAssociatedComponent,
} from "./get-associated-components"

export interface SystemBlockViewerProps {
  circuitJson: CircuitJson
  containerStyle?: CSSProperties
  className?: string
  /** Enables component actions in the block details panel. */
  onComponentClick?: (component: SystemBlockAssociatedComponent) => void
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
  onComponentClick,
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
            page={page}
            circuitJson={circuitJson}
            onComponentClick={onComponentClick}
          />
        </>
      )}
    </div>
  )
}

function SystemViewport({
  src,
  name,
  page,
  circuitJson,
  onComponentClick,
}: {
  src: string
  name: string
  page: SystemBlockPage
  circuitJson: CircuitJson
  onComponentClick?: SystemBlockViewerProps["onComponentClick"]
}) {
  const [selectedId, setSelectedId] = useState<string>()
  const [focusedId, setFocusedId] = useState<string>()
  const blocks = circuitJson
    .filter(
      (e): e is SystemBlockComponent | SystemBlockGroup =>
        (e.type === "system_block_component" ||
          e.type === "system_block_group") &&
        e.system_block_page_id === page.system_block_page_id,
    )
    .sort((a, b) =>
      a.type !== b.type
        ? a.type === "system_block_group"
          ? -1
          : 1
        : b.width * b.height - a.width * a.height,
    )
  const blockId = (block: SystemBlockComponent | SystemBlockGroup) =>
    block.type === "system_block_component"
      ? block.system_block_component_id
      : block.system_block_group_id
  const selected = blocks.find((block) => blockId(block) === selectedId)
  const associated = selected
    ? getAssociatedComponents(circuitJson, selected)
    : []
  // Pointer events distinguish taps from mouse/touch pans and multi-touch zoom.
  const gesture = useRef<{
    x: number
    y: number
    id: number
    moved: boolean
  } | null>(null)

  const { ref, transform } = useMouseMatrixTransform({ shouldDrag: shouldPan })
  return (
    <div
      style={{ position: "relative", display: "flex", flex: 1, minHeight: 0 }}
    >
      <div
        ref={ref}
        onPointerDownCapture={(event) => {
          if (!event.isPrimary || event.button !== 0 || event.ctrlKey) {
            if (gesture.current) gesture.current.moved = true
            return
          }
          gesture.current = {
            x: event.clientX,
            y: event.clientY,
            id: event.pointerId,
            moved: false,
          }
        }}
        onPointerMoveCapture={(event) => {
          const start = gesture.current
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5
          )
            start.moved = true
        }}
        onPointerCancel={() => {
          gesture.current = null
        }}
        onPointerLeave={() => {
          if (gesture.current) gesture.current.moved = true
        }}
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
        <svg
          aria-label="System blocks"
          viewBox={`0 0 ${page.width} ${page.height}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transformOrigin: "0 0",
            transform: transformToString(transform),
          }}
        >
          {blocks.map((block) => {
            const id = blockId(block)
            const title = block.display_name ?? block.name ?? id
            return (
              <rect
                key={id}
                data-system-block-id={id}
                role="button"
                tabIndex={0}
                aria-label={`Show components for ${title}`}
                aria-expanded={selectedId === id}
                x={page.width / 2 + block.center.x - block.width / 2}
                y={page.height / 2 - block.center.y - block.height / 2}
                width={block.width}
                height={block.height}
                rx={1}
                fill="transparent"
                stroke={
                  selectedId === id || focusedId === id ? "#2563eb" : "none"
                }
                strokeWidth={0.5}
                style={{ cursor: "pointer", outline: "none" }}
                onFocus={() => setFocusedId(id)}
                onBlur={() => setFocusedId(undefined)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedId(id)
                  }
                  if (event.key === "Escape") setSelectedId(undefined)
                }}
                onPointerUp={(event) => {
                  const start = gesture.current
                  gesture.current = null
                  if (
                    start &&
                    start.id === event.pointerId &&
                    !start.moved &&
                    Math.hypot(
                      event.clientX - start.x,
                      event.clientY - start.y,
                    ) <= 5
                  )
                    setSelectedId(id)
                }}
              />
            )
          })}
        </svg>
      </div>
      {selected && (
        <section
          aria-label="Associated components"
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedId(undefined)
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 280,
            maxWidth: "calc(100% - 24px)",
            maxHeight: "calc(100% - 24px)",
            overflow: "auto",
            padding: 16,
            boxSizing: "border-box",
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 4px 12px #0002",
            font: "14px Arial, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 16 }}>
              {selected.display_name ?? selected.name ?? selectedId}
            </h2>
            <button
              type="button"
              aria-label="Close component details"
              onClick={() => setSelectedId(undefined)}
              style={{
                cursor: "pointer",
                background: "none",
                border: 0,
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
          {selected.description && <p>{selected.description}</p>}
          <h3 style={{ fontSize: 13 }}>Associated components</h3>
          {associated.length === 0 ? (
            <p>No associated components.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {associated.map((component) => {
                const content = (
                  <>
                    <strong>{component.refdes}</strong>
                    <span
                      style={{ color: "#4b5563", overflowWrap: "anywhere" }}
                    >
                      MPN:{" "}
                      {component.manufacturer_part_number || "Not specified"}
                    </span>
                  </>
                )
                const style: CSSProperties = {
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "10px 8px",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                  font: "inherit",
                }
                return (
                  <li
                    key={component.source_component_id}
                    style={{ borderTop: "1px solid #e5e7eb" }}
                  >
                    {onComponentClick ? (
                      <button
                        type="button"
                        style={{
                          ...style,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: 0,
                          cursor: "pointer",
                        }}
                        onClick={() => onComponentClick(component)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div style={style}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
