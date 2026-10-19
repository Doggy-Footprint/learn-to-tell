// Shared by the sweep scenarios: a range knob #<id> (0..10, step 1, start 2) with value text #<id>-v and goal box #<id>-g.
H.knob = (id, extra = "") => `<div id="${id}-g"></div><label class="ltt-param">${id} <b id="${id}-v"></b><input type="range" id="${id}" min="0" max="10" step="1" value="2"></label>${extra}`;
H.sweepScene = (id, opts = {}, extra = "") => ({ title: "손잡이 " + id, sub: "s", mount(body) {
  body.innerHTML = H.knob(id, extra);
  H.samples["ret:" + id] = Object.keys(LTT.sweep({ params: { [id]: {} }, render(v) { H.log.push([id, v[id], H.now()]); },
    goal: { el: id + "-g", text: "8을 찾는다", check: (v) => v[id] === 8 }, ...opts }) || {});
  return {};
} });
H.watchKnob = (id, from, to) => {
  for (let t = from; t <= to; t += 100) H.at(t, () => {
    const i = document.getElementById(id), v = document.getElementById(id + "-v"), g = document.getElementById(id + "-g");
    const goalCls = g ? [g, ...g.querySelectorAll("*")].some((e) => e.classList.contains("done") || e.classList.contains("first")) : null;
    H.watch.push([id, i && i.value, v && v.textContent, goalCls, H.now()]);
  });
};
