import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"

export function setup() {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" })
  const keys = [
    "window",
    "document",
    "HTMLElement",
    "MouseEvent",
    "WheelEvent",
    "Event",
    "IS_REACT_ACT_ENVIRONMENT",
  ]
  const previous = Object.fromEntries(
    keys.map((key) => [key, Reflect.get(globalThis, key)]),
  )
  for (const key of keys)
    Reflect.set(globalThis, key, Reflect.get(dom.window, key))
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)
  const root = createRoot(document.getElementById("root")!)
  return {
    root,
    async cleanup() {
      await act(async () => root.unmount())
      Object.assign(globalThis, previous)
      dom.window.close()
    },
  }
}
