import type {
  CircuitJson,
  SystemBlockComponent,
  SystemBlockGroup,
} from "circuit-json"

export interface SystemBlockAssociatedComponent {
  pcb_component_id: string
  source_component_id: string
  refdes: string
  manufacturer_part_number?: string
}

/** Explicit component selections take precedence over a containing subcircuit. */
export function getAssociatedComponents(
  circuitJson: CircuitJson,
  block: SystemBlockComponent | SystemBlockGroup,
): SystemBlockAssociatedComponent[] {
  const ids = new Set(block.pcb_component_ids ?? [])
  if (!block.pcb_component_ids && block.pcb_group_id) {
    const groups = circuitJson.filter((e) => e.type === "pcb_group")
    const group = groups.find((e) => e.pcb_group_id === block.pcb_group_id)
    const sourceGroupIds = new Set(group ? [group.source_group_id] : [])
    const sourceGroups = circuitJson.filter((e) => e.type === "source_group")
    // Follow logical hierarchy, never placement-relative group references.
    let expanded = true
    while (expanded) {
      expanded = false
      for (const child of sourceGroups) {
        if (
          child.parent_source_group_id &&
          sourceGroupIds.has(child.parent_source_group_id) &&
          !sourceGroupIds.has(child.source_group_id)
        ) {
          sourceGroupIds.add(child.source_group_id)
          expanded = true
        }
      }
    }
    const pcbGroupIds = new Set([block.pcb_group_id])
    for (const candidate of groups) {
      if (sourceGroupIds.has(candidate.source_group_id)) {
        pcbGroupIds.add(candidate.pcb_group_id)
        for (const id of candidate.pcb_component_ids) ids.add(id)
      }
    }
    for (const component of circuitJson) {
      if (
        component.type === "pcb_component" &&
        component.pcb_group_id &&
        pcbGroupIds.has(component.pcb_group_id)
      )
        ids.add(component.pcb_component_id)
    }
  }
  const sources = new Map(
    circuitJson
      .filter((e) => e.type === "source_component")
      .map((e) => [e.source_component_id, e]),
  )
  const seen = new Set<string>()
  return circuitJson
    .flatMap((e) => {
      if (
        e.type !== "pcb_component" ||
        !ids.has(e.pcb_component_id) ||
        seen.has(e.source_component_id)
      )
        return []
      const source = sources.get(e.source_component_id)
      if (!source) return []
      seen.add(e.source_component_id)
      return [
        {
          pcb_component_id: e.pcb_component_id,
          source_component_id: source.source_component_id,
          refdes: source.name,
          manufacturer_part_number: source.manufacturer_part_number,
        },
      ]
    })
    .sort((a, b) =>
      a.refdes.localeCompare(b.refdes, undefined, { numeric: true }),
    )
}
