---
lesson: 20260905-matmul
date: 2026-09-05
concepts:
  - id: matrix-multiply
    title: "Blocked matrix multiply"
    definition: "split A, B, C into blocks so each block product fits in fast memory"
    domains: ["linear-algebra"]
    level: 3
    requires: ["shared-memory-tiling"]
    leads_to: ["cublas-gemm"]
    quiz: pass
  - id: warp-divergence
    title: "Warp divergence"
    definition: "branches inside a warp serialize the lanes that disagree"
    domains: ["gpu"]
    level: 3
    requires: ["gpu-warp"]
    quiz: none
---

# Result

Matmul lesson record.
