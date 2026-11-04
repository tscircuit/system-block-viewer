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
  Empty: () => <SystemBlockViewer circuitJson={[]} />,
}
