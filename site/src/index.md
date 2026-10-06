---
title: Learn to Tell 수업
style: components/style.css
---

<div id="app"></div>

```js
import {mount} from "./components/ui.js";
import session from "./session.js";
import lesson from "./lesson.js";
import * as model from "./model.js";

mount(session, lesson, model.model);
```
