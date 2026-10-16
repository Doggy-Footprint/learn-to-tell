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

// Same view-transition-name on a grid chip, a focus node and the focus center lets the browser morph the clicked
// concept into the center, both within the focus page and across the grid→focus navigation.
// Names must be unique per page or the browser skips the transition, so a concept shown twice (a cycle) is named once.
function nameNodes(root) {
  const seen = new Set();
  root.querySelectorAll("[data-id]").forEach((el) => {
    const name = `c-${el.dataset.id.replace(/[^a-z0-9-]/gi, "_")}`;
    if (seen.has(name)) return;
    seen.add(name);
    el.style.viewTransitionName = name;
  });
}

const app = document.getElementById("app");
const data = await loadData();
if (document.body.dataset.view === "grid") {
  app.innerHTML = renderGrid(layoutGrid(data), { missing: data === null });
  wireHighlight(app);
  nameNodes(app);
} else {
  const draw = (id) => {
    app.innerHTML = renderFocus(layoutFocus(data, id), { missing: data === null });
    app.querySelector(".center")?.setAttribute("data-id", id);
    nameNodes(app);
  };
  const go = (id, push) => {
    const run = () => {
      draw(id);
      if (push) history.pushState({ id }, "", `focus.html?id=${encodeURIComponent(id)}`);
      scrollTo({ top: 0 });
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(run);
    else run();
  };
  app.addEventListener("click", (event) => {
    const link = event.target.closest?.("a.node");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    go(link.dataset.id, true);
  });
  addEventListener("popstate", () => go(new URLSearchParams(location.search).get("id") ?? "", false));
  draw(new URLSearchParams(location.search).get("id") ?? "");
}
