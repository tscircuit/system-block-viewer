import { expect, test } from "bun:test"
import { act } from "react"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { SystemBlockViewer } from "../lib"
import original from "../examples/assets/system-blocks.circuit.json"
import { setup } from "./setup"

test("curved routes use the host renderer without losing their controls", async () => {
  const circuitJson = original.map((element) =>
    element.type === "system_block_connection"
      ? {
          ...element,
          route: [
            { x: 0, y: 0 },
            {
              x: 20,
              y: 20,
              cubic_bezier_control_points: [
                { x: 20, y: 0 },
                { x: 20, y: 10 },
              ],
            },
          ],
        }
      : element,
  ) as CircuitJson
  const { root, cleanup } = setup()
  try {
    await act(async () =>
      root.render(<SystemBlockViewer circuitJson={circuitJson} />),
    )
    const svg = decodeURIComponent(
      document.querySelector("img")!.src.split(",").slice(1).join(","),
    )
    expect(svg).toBe(
      convertCircuitJsonToSystemSvg(circuitJson, {
        systemBlockPageId: circuitJson.find(
          (e) => e.type === "system_block_page",
        )!.system_block_page_id,
      }),
    )
    expect(svg).toMatch(/d="M[^"\n]*C/)
  } finally {
    await cleanup()
  }
})
