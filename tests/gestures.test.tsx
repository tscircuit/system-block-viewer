import { expect, test } from "bun:test"
import { act } from "react"
import type { CircuitJson } from "circuit-json"
import { SystemBlockViewer } from "../lib"
import circuitJson from "../examples/assets/system-blocks.circuit.json"
import { setup } from "./setup"

test("shared schematic gestures zoom with the wheel, pan with mouse/touch, and pinch without toolbar controls", async () => {
  const { root, cleanup } = setup()
  try {
    await act(async () =>
      root.render(
        <SystemBlockViewer circuitJson={circuitJson as CircuitJson} />,
      ),
    )
    const viewport = document.querySelector<HTMLElement>(
      '[aria-label="System diagram viewport"]',
    )!
    viewport.getBoundingClientRect = () => ({
      x: 100,
      y: 50,
      left: 100,
      top: 50,
      right: 900,
      bottom: 650,
      width: 800,
      height: 600,
      toJSON() {},
    })
    const img = document.querySelector("img")!
    const matrix = () => img.style.transform.match(/-?[\d.]+/g)!.map(Number)
    expect(document.querySelector("button")).toBeNull()
    expect(viewport.style.overflow).toBe("hidden")
    expect(decodeURIComponent(img.src)).toContain("Environment sensor")
    expect(matrix()).toEqual([1, 0, 0, 1, 0, 0])
    const wheel = new WheelEvent("wheel", {
      clientX: 200,
      clientY: 150,
      deltaY: 100,
      cancelable: true,
    })
    await act(async () => {
      viewport.dispatchEvent(wheel)
    })
    expect(wheel.defaultPrevented).toBe(true)
    expect(matrix()).toEqual([0.9, 0, 0, 0.9, 10, 10])
    await act(async () => {
      viewport.dispatchEvent(
        new MouseEvent("mousedown", { clientX: 200, clientY: 150, button: 0 }),
      )
    })
    await act(async () => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 240, clientY: 180 }),
      )
    })
    await act(async () => {
      viewport.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 240, clientY: 180 }),
      )
    })
    expect(matrix()).toEqual([0.9, 0, 0, 0.9, 50, 40])
    // Right-click and Ctrl+left-click are reserved, matching schematic-viewer.
    for (const options of [{ button: 2 }, { button: 0, ctrlKey: true }]) {
      await act(async () => {
        viewport.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 240,
            clientY: 180,
            ...options,
          }),
        )
      })
      await act(async () => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 300, clientY: 210 }),
        )
      })
      await act(async () => {
        viewport.dispatchEvent(
          new MouseEvent("mouseup", { clientX: 300, clientY: 210, ...options }),
        )
      })
      expect(matrix()).toEqual([0.9, 0, 0, 0.9, 50, 40])
    }
    const touch = async (type: string, points: number[][]) => {
      const event = new Event(type, { cancelable: true })
      const touches = points.map(([clientX, clientY], identifier) => ({
        identifier,
        clientX,
        clientY,
      }))
      Object.defineProperties(event, {
        touches: { value: touches },
        changedTouches: { value: touches },
      })
      await act(async () => {
        viewport.dispatchEvent(event)
      })
      expect(event.defaultPrevented).toBe(true)
    }
    await touch("touchstart", [[200, 150]])
    await touch("touchmove", [[230, 170]])
    await touch("touchend", [[230, 170]])
    expect(matrix()).toEqual([0.9, 0, 0, 0.9, 80, 60])
    await touch("touchstart", [
      [200, 200],
      [300, 200],
    ])
    await touch("touchmove", [
      [150, 200],
      [350, 200],
    ])
    await touch("touchend", [
      [150, 200],
      [350, 200],
    ])
    expect(matrix()[0]).toBeCloseTo(1.8)
    expect(matrix()[3]).toBeCloseTo(1.8)
  } finally {
    await cleanup()
  }
})
