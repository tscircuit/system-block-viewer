import type { CircuitJson } from "circuit-json"
import original from "./system-blocks.circuit.json"

export const associatedCircuitJson = [
  ...original.map((e) =>
    e.type === "system_block_component" && e.name === "sensor"
      ? { ...e, pcb_component_ids: ["pcb_u1", "pcb_r1"] }
      : e.type === "system_block_group"
        ? { ...e, pcb_group_id: "pcb_processing" }
        : e,
  ),
  {
    type: "source_group",
    source_group_id: "source_processing",
    name: "processing",
  },
  {
    type: "pcb_group",
    pcb_group_id: "pcb_processing",
    source_group_id: "source_processing",
    pcb_component_ids: ["pcb_u1", "pcb_r1"],
    center: { x: 0, y: 0 },
    anchor_alignment: "center",
  },
  {
    type: "source_component",
    source_component_id: "source_u1",
    ftype: "simple_chip",
    name: "U1",
    manufacturer_part_number: "BME280",
  },
  {
    type: "source_component",
    source_component_id: "source_r1",
    ftype: "simple_resistor",
    name: "R1",
    resistance: 10000,
  },
  ...["u1", "r1"].map((id) => ({
    type: "pcb_component",
    pcb_component_id: `pcb_${id}`,
    source_component_id: `source_${id}`,
    pcb_group_id: "pcb_processing",
    layer: "top",
    rotation: 0,
    center: { x: 0, y: 0 },
    width: 2,
    height: 2,
  })),
] as CircuitJson
