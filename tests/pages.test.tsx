import { expect, test } from "bun:test"
import { act } from "react"
import type { CircuitJson } from "circuit-json"
import { SystemBlockViewer } from "../lib"
import original from "../examples/assets/system-blocks.circuit.json"
import { setup } from "./setup"

test("pages are isolated, selection resets gestures, and removed pages recover on rerun", async () => {
  const { root, cleanup } = setup()
  try {
    const second = original
      .filter((item) => item.type.startsWith("system_block_"))
      .map((item) => {
        const copy = JSON.parse(JSON.stringify(item), (key, value) =>
          typeof value === "string" &&
          key !== "type" &&
          value.startsWith("system_block_")
            ? `second_${value}`
            : value,
        )
        if (copy.type === "system_block_page") copy.display_name = "Second page"
        if (copy.type === "system_block_component")
          copy.display_name = "Second-page block"
        return copy
      })
    const render = async (json: unknown[]) => {
      await act(async () =>
        root.render(
          <SystemBlockViewer
            circuitJson={json as CircuitJson}
            containerStyle={{ height: 500 }}
            className="my-viewer"
          />,
        ),
      )
    }
    const image = () => document.querySelector("img")!
    await render([...original, ...second])
    expect(
      document.querySelector<HTMLElement>(".my-viewer")?.style.height,
    ).toBe("500px")
    expect(decodeURIComponent(image().src)).toContain("Environment sensor")
    expect(decodeURIComponent(image().src)).not.toContain("Second-page block")
    await act(async () => {
      document
        .querySelector('[aria-label="System diagram viewport"]')!
        .dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }))
    })
    expect(image().style.transform).not.toBe("matrix(1,0,0,1,0,0)")
    const select = document.querySelector("select")!
    await act(async () => {
      select.value = select.options[1]!.value
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(decodeURIComponent(image().src)).toContain("Second-page block")
    expect(decodeURIComponent(image().src)).not.toContain("Environment sensor")
    expect(image().style.transform).toBe("matrix(1,0,0,1,0,0)")
    await render(original)
    expect(document.querySelector("select")).toBeNull()
    expect(decodeURIComponent(image().src)).toContain("Environment sensor")
    await render([])
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No system diagrams",
    )
    expect(document.querySelector("img")).toBeNull()
    await render(original)
    expect(decodeURIComponent(image().src)).toContain("Environment sensor")
  } finally {
    await cleanup()
  }
})
