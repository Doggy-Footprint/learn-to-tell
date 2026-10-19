const scenes = [{ type: "hook", text: "스물다섯 장면" }];
for (let i = 2; i <= 24; i++) scenes.push(i % 2 ? SHEET.colourFig("s" + i, []) : SHEET.colourFig("s" + i, [{ t: [600, 1000], text: "앞" + i }, { t: [1600, 2000], text: "뒤" + i }]));
scenes.push({ type: "keywords", terms: [] });
LTT.deck({ title: "sheet many", theme: "paper", scenes });
