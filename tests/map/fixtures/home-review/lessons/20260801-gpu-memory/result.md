---
lesson: 20260801-gpu-memory
date: 2026-08-01
concepts:
  - id: memory-hierarchy
    title: "GPU memory hierarchy"
    definition: "registers, shared memory, L2 and HBM differ in size and latency"
    domains: ["gpu"]
    level: 1
    leads_to: ["gpu-warp"]
    quiz: pass
  - id: gpu-warp
    title: "Warp"
    aliases: ["warp", "wavefront"]
    definition: "32 threads that execute one instruction in lockstep"
    domains: ["gpu"]
    level: 2
    requires: ["memory-hierarchy"]
    leads_to: ["warp-divergence", "occupancy"]
    quiz: pass
  - id: shared-memory-tiling
    title: "Shared-memory tiling"
    definition: "stage a tile in shared memory so each global load is reused"
    domains: ["gpu", "linear-algebra"]
    level: 3
    requires: ["gpu-warp"]
    quiz: fail
---

# Result

GPU memory lesson record.
