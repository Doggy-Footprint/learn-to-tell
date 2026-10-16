import { layoutFocus, layoutGrid, renderFocus, renderGrid } from "./lib/layout.mjs";

async function loadData() {
  try {
    const res = await fetch("/map/data.json");
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function wireHighlight(app) {
  const clear = () => app.querySelectorAll(".chip.linked, .chip.active").forEach((el) => el.classList.remove("linked", "active"));
  const on = (event) => {
    const chip = event.target.closest?.(".chip");
    if (!chip) return;
    clear();
    chip.classList.add("active");
    const linked = new Set(chip.dataset.neighbors.split(" ").filter(Boolean));
    app.querySelectorAll(".chip").forEach((el) => {
      if (linked.has(el.dataset.id)) el.classList.add("linked");
    });
  };
  app.addEventListener("mouseover", on);
  app.addEventListener("focusin", on);
  app.addEventListener("mouseout", clear);
  app.addEventListener("focusout", clear);
}

const app = document.getElementById("app");
const data = await loadData();
if (document.body.dataset.view === "grid") {
  app.innerHTML = renderGrid(layoutGrid(data), { missing: data === null });
  wireHighlight(app);
} else {
  const id = new URLSearchParams(location.search).get("id") ?? "";
  app.innerHTML = renderFocus(layoutFocus(data, id), { missing: data === null });
}
