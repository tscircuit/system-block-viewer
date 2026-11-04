import { expect, test } from "bun:test"
import { act } from "react"
import { SystemBlockViewer, type SystemBlockAssociatedComponent } from "../lib"
import { getAssociatedComponents } from "../lib/get-associated-components"
import { associatedCircuitJson as json } from "../examples/assets/associated-components"
import { setup } from "./setup"
import type { CircuitJson, SystemBlockComponent } from "circuit-json"

const block = json.find(
  (e) => e.type === "system_block_component" && e.name === "sensor",
) as SystemBlockComponent

test("resolves explicit links, deduplicates sources, and expands nested subcircuits without widening explicit selections", () => {
  const nested = [
    ...json,
    {
      type: "source_group",
      source_group_id: "child",
      parent_source_group_id: "source_processing",
    },
    {
      type: "pcb_group",
      pcb_group_id: "pcb_child",
      source_group_id: "child",
      pcb_component_ids: [],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_u2",
      source_component_id: "source_u2",
      pcb_group_id: "pcb_child",
    },
    {
      type: "source_component",
      source_component_id: "source_u2",
      name: "U2",
      manufacturer_part_number: "RP2040",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_u1_duplicate",
      source_component_id: "source_u1",
      pcb_group_id: "pcb_child",
    },
  ] as CircuitJson
  expect(getAssociatedComponents(nested, block).map((e) => e.refdes)).toEqual([
    "R1",
    "U1",
  ])
  const groupOnly = {
    ...block,
    pcb_component_ids: undefined,
    pcb_group_id: "pcb_processing",
  }
  expect(
    getAssociatedComponents(nested, groupOnly).map((e) => e.refdes),
  ).toEqual(["R1", "U1", "U2"])
  expect(
    getAssociatedComponents(nested, {
      ...groupOnly,
      pcb_component_ids: ["pcb_u1", "pcb_u1", "missing"],
    }).map((e) => e.refdes),
  ).toEqual(["U1"])
  expect(
    getAssociatedComponents(nested, { ...groupOnly, pcb_group_id: "missing" }),
  ).toEqual([])
})

test("block taps and keyboard selection show refdes/MPN; actions are opt-in and dragging/pinching do not select", async () => {
  const { root, cleanup } = setup()
  try {
    const selections: SystemBlockAssociatedComponent[] = []
    const render = async (clickable = false, circuitJson = json) =>
      act(async () =>
        root.render(
          <SystemBlockViewer
            circuitJson={circuitJson}
            onComponentClick={clickable ? (e) => selections.push(e) : undefined}
          />,
        ),
      )
    await render()
    const target = () =>
      document.querySelector(
        '[aria-label="Show components for Environment sensor"]',
      )!
    const panel = () =>
      document.querySelector('[aria-label="Associated components"]')
    const pointer = async (
      type: string,
      options: Record<string, unknown> = {},
    ) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        clientX: 10,
        clientY: 10,
        ...options,
      })
      Object.defineProperties(event, {
        pointerId: { value: options.pointerId ?? 1 },
        isPrimary: { value: options.isPrimary ?? true },
      })
      await act(async () => {
        target().dispatchEvent(event)
      })
    }
    await pointer("pointerdown")
    await pointer("pointermove", { clientX: 50 })
    await pointer("pointerup") // returning to the origin is still a drag
    expect(panel()).toBeNull()
    await pointer("pointerdown")
    await pointer("pointerdown", { pointerId: 2, isPrimary: false })
    await pointer("pointerup")
    expect(panel()).toBeNull()
    await pointer("pointerdown", { button: 2 })
    await pointer("pointerup", { button: 2 })
    expect(panel()).toBeNull()
    await pointer("pointerdown")
    await pointer("pointerup")
    expect(panel()?.textContent).toContain("U1")
    expect(panel()?.textContent).toContain("MPN: BME280")
    expect(panel()?.textContent).toContain("MPN: Not specified")
    expect(panel()?.querySelectorAll("button").length).toBe(1) // Close only
    await render(true)
    const action = Array.from(panel()!.querySelectorAll("button")).find((e) =>
      e.textContent?.includes("U1"),
    )!
    await act(async () => action.click())
    expect(selections[0]).toEqual({
      pcb_component_id: "pcb_u1",
      source_component_id: "source_u1",
      refdes: "U1",
      manufacturer_part_number: "BME280",
    })
    await act(async () => {
      panel()!.querySelector("button")!.click()
    })
    expect(panel()).toBeNull()
    await act(async () => {
      target().dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      )
    })
    expect(panel()).not.toBeNull()
    // A rerender must use current associations, and removing a block removes its details.
    await render(
      true,
      json.filter((e) => e.type !== "source_component"),
    )
    expect(panel()?.textContent).toContain("No associated components")
    await render(
      true,
      json.filter((e) => e !== block && e.type !== "system_block_connection"),
    )
    expect(panel()).toBeNull()
  } finally {
    await cleanup()
  }
})
