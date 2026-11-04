import { useState } from "react"
import { associatedCircuitJson } from "./assets/associated-components"
import type { CircuitJson } from "circuit-json"
import { SystemBlockViewer } from "../lib"
import circuitJson from "./assets/system-blocks.circuit.json"

export default {
  "Wireless sensor": () => (
    <SystemBlockViewer
      circuitJson={circuitJson as CircuitJson}
      containerStyle={{ height: "100vh" }}
    />
  ),
  "Associated components": () => (
    <SystemBlockViewer
      circuitJson={associatedCircuitJson}
      containerStyle={{ height: "100vh" }}
    />
  ),
  "Component actions": () => {
    const [selected, setSelected] = useState("")
    return (
      <>
        <div role="status">
          {selected || "Select a block, then a component"}
        </div>
        <SystemBlockViewer
          circuitJson={associatedCircuitJson}
          containerStyle={{ height: "calc(100vh - 30px)" }}
          onComponentClick={(component) =>
            setSelected(
              `Selected ${component.refdes} (${component.source_component_id})`,
            )
          }
        />
      </>
    )
  },
  Empty: () => <SystemBlockViewer circuitJson={[]} />,
}
