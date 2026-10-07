import {applyAction, createRuntime, FREE_KINDS, HELP_LEVELS, HINT_LEVELS, STAGES, predictionState} from '../learning/progress.mjs';
import {gradeTransferPrediction, toleranceText} from '../learning/grading.mjs';
import {buildResult, finalizeResult, validateResultShape} from '../learning/result.mjs';
import {loadProgress, saveProgress, storageKey} from '../learning/storage.mjs';
import {formatCount} from '../learning/format.mjs';
import {h, replaceChildren} from './dom.js';
import {EXPORT_BLOCKED_NOTICE, EXPORT_NOTICE, EXPORT_SUBMITTED_NOTICE, EXPORT_SUBMIT_FAILED_NOTICE, HELP_LABELS, NUMBER_NOTES, OBSERVATION_NOTICE, SAFETY_NOTICE, STATUS_LABELS, STORAGE_NOTICES} from './content.js';

const numberOrNaN = element => element.validity.badInput || element.value.trim() === '' ? Number.NaN : Number(element.value);
const UNDEFINED_TEXT = '정의되지 않음';

function table(testid, caption, head, rows) {
  return h('table', {testid},
    h('caption', {text: caption}),
    h('thead', {}, h('tr', {}, head.map(label => h('th', {scope: 'col', text: label})))),
    h('tbody', {}, rows));
}

function statusLine(status) {
  const [icon, label, code] = STATUS_LABELS[status];
  return h('p', {class: `grade grade-${status}`, testid: 'transfer-grade', 'data-status': status}, h('span', {'aria-hidden': 'true', text: `${icon} `}), `${label} (${code})`);
}

export function mount(session, lesson, model) {
  document.documentElement.lang = 'ko';
  // The Framework template pins maximum-scale=1, which blocks user zoom.
  document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1');
  const runtime = createRuntime(lesson, model);
  const {outputs} = runtime;
  const outputById = new Map(outputs.map(output => [output.outputId, output]));
  const labelOf = outputId => outputById.get(outputId).label;
  const inputLabel = input => `${input.inputId} (${input.unit})`;
  const describeInputs = inputs => runtime.inputs.map(input => `${input.inputId} ${inputs[input.inputId]}${input.unit}`).join(' · ');
  const formatValue = value => value === null ? UNDEFINED_TEXT : formatCount(value);
  const formatPredicted = (output, value) => value === null ? UNDEFINED_TEXT : `${formatCount(value)} ${output.unit}`;
  const calculate = inputs => {
    const result = model.calculate(inputs);
    return result.ok ? result.value : null;
  };
  const displayOf = raw => Object.fromEntries(outputs.map(({outputId, scale}) => [outputId, raw[outputId] === null ? null : raw[outputId] * scale]));

  let storage = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  const loaded = loadProgress(storage, session, runtime);
  const state = {progress: loaded.progress, loadNotice: loaded.notice, saveFailed: false, errors: {}, openConcept: null, confirmReset: false, exportError: null, exportSubmitted: false, exportSubmitError: null, highlight: null, returnY: 0, lastValid: null};

  const dispatch = action => {
    const result = applyAction(state.progress, {...action, at: new Date().toISOString()}, runtime);
    if (result.ok) {
      state.progress = result.progress;
      state.saveFailed = !saveProgress(storage, state.progress).ok;
      renderFinish();
    }
    return result;
  };

  const slots = {};
  const slot = name => slots[name] ??= h('div', {class: 'slot'});

  const fieldRows = cellFor => outputs.map(output => h('tr', {}, h('th', {scope: 'row', text: `${output.label} (${output.unit})`}), cellFor(output)));

  function predictionForm(prefix) {
    const fields = {};
    const boxes = {};
    const rows = outputs.map(output => {
      const id = `${prefix}-${output.outputId}`;
      fields[output.outputId] = h('input', {id, type: 'number', step: 'any', inputmode: 'decimal', testid: id});
      const row = h('div', {class: 'field-row'}, h('label', {for: id, text: `${output.label} (${output.unit})`}), fields[output.outputId]);
      if (output.nullable) {
        boxes[output.outputId] = h('input', {type: 'checkbox', id: `${id}-undefined`, testid: `${id}-undefined`});
        row.append(boxes[output.outputId], h('label', {for: `${id}-undefined`, text: `${UNDEFINED_TEXT}으로 답함`}));
        boxes[output.outputId].addEventListener('change', sync);
      }
      return row;
    });
    function sync() {
      for (const [outputId, box] of Object.entries(boxes)) {
        if (box.checked) fields[outputId].value = '';
        fields[outputId].disabled = box.checked || box.disabled;
      }
    }
    const errorSlot = h('div', {class: 'slot'});
    return {
      node: h('div', {class: 'prediction-fields'}, rows, errorSlot),
      read() {
        const values = {};
        const bad = [];
        for (const {outputId} of outputs) {
          if (boxes[outputId]?.checked) values[outputId] = null;
          else if (Number.isNaN(numberOrNaN(fields[outputId]))) bad.push(outputId);
          else values[outputId] = numberOrNaN(fields[outputId]);
        }
        return {values, bad};
      },
      write(values) {
        for (const {outputId} of outputs) {
          fields[outputId].value = values && values[outputId] !== null ? String(values[outputId]) : '';
          if (boxes[outputId]) boxes[outputId].checked = values !== null && values[outputId] === null;
        }
        sync();
      },
      lock(locked) {
        for (const input of Object.values(fields)) input.disabled = locked;
        for (const box of Object.values(boxes)) box.disabled = locked;
        sync();
      },
      showError(testid, message, ids) {
        for (const {outputId} of outputs) {
          if (ids.includes(outputId)) fields[outputId].setAttribute('aria-invalid', 'true');
          else fields[outputId].removeAttribute('aria-invalid');
        }
        replaceChildren(errorSlot, message ? h('p', {class: 'error', role: 'alert', testid, text: `⚠ ${message}`}) : null);
      },
    };
  }

  function feedback(context, grade) {
    const total = outputs.length;
    const mismatched = grade.mismatched.map(labelOf).join(', ');
    let fact;
    let support;
    if (grade.status === 'skipped') {
      fact = `${context}에서 예측을 건너뛰었습니다. 이번 조건에서는 예측 수행이 관찰되지 않았습니다.`;
      support = '결과는 그대로 볼 수 있고, 준비되면 최초 기록을 남긴 채 다시 시도할 수 있습니다.';
    } else if (grade.status === 'supported') {
      fact = `${context}에서 ${total}개 항목이 모두 허용 오차(${toleranceText(lesson)}) 안에서 일치했습니다. 조건이 바뀌면 다시 확인합니다.`;
      support = '확인된 부분을 바탕으로 다음 선택을 함께 살펴볼 수 있습니다.';
    } else {
      fact = `${context}에서 ${grade.matched.length}/${total}개 항목이 일치했고, 예측과 다른 결과가 나온 항목은 ${mismatched}입니다. 허용 오차는 ${toleranceText(lesson)}입니다.`;
      support = '다른 항목 하나부터 같이 보겠습니다. 필요하면 힌트 단계를 고르거나 최초 예측을 남긴 채 다시 시도하고, 보류해도 됩니다.';
    }
    return h('div', {class: 'feedback'}, h('p', {}, h('strong', {text: '관찰한 사실(A): '}), fact), h('p', {}, h('strong', {text: '다음 행동(B): '}), support));
  }

  function comparisonTable(testid, caption, values, expected) {
    const grade = gradeTransferPrediction(values, expected, lesson);
    return table(testid, caption, ['항목', '최초 예측', '계산 결과', '허용 오차 비교'], fieldRows(output => [
      h('td', {text: values === null ? '건너뜀' : formatPredicted(output, values[output.outputId])}),
      h('td', {'data-output': output.outputId, text: formatValue(expected[output.outputId])}),
      h('td', {text: values === null ? '–' : grade.matched.includes(output.outputId) ? '✓ 일치' : '✕ 차이 있음'}),
    ]));
  }

  const conceptButtons = lesson.concepts.map(concept => {
    const trigger = h('button', {type: 'button', testid: `concept-${concept.conceptId}`, 'aria-expanded': 'false', text: concept.label.split(':')[0]});
    trigger.addEventListener('click', () => {
      state.openConcept = state.openConcept === concept.conceptId ? null : concept.conceptId;
      renderConcepts();
    });
    return {concept, trigger, cardSlot: h('div', {class: 'slot'})};
  });
  function renderConcepts() {
    for (const {concept, trigger, cardSlot} of conceptButtons) {
      const open = state.openConcept === concept.conceptId;
      trigger.setAttribute('aria-expanded', String(open));
      replaceChildren(cardSlot, open ? h('section', {class: 'concept-card', testid: `concept-card-${concept.conceptId}`, 'aria-label': `${concept.label} 개념 카드`},
        h('p', {}, h('strong', {text: concept.label})),
        h('p', {}, h('strong', {text: '뜻: '}), concept.meaning), h('p', {}, h('strong', {text: '예: '}), concept.example),
        h('p', {}, h('strong', {text: '혼동하기 쉬운 뜻: '}), concept.confusion), h('p', {}, h('strong', {text: '평문 수식: '}), concept.plain),
        h('p', {class: 'hint-line', text: 'Escape 키로 닫을 수 있습니다.'})) : null);
    }
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || state.openConcept === null) return;
    const open = conceptButtons.find(item => item.concept.conceptId === state.openConcept);
    state.openConcept = null;
    renderConcepts();
    open.trigger.focus();
  });

  const inputNodes = {};
  const errorSlots = {};
  const inputRows = runtime.inputs.map(spec => {
    const {inputId} = spec;
    const input = h('input', {id: `input-${inputId}`, type: 'number', step: 'any', min: spec.min, max: spec.max, inputmode: 'decimal', testid: `input-${inputId}`});
    inputNodes[inputId] = input;
    errorSlots[inputId] = h('div', {class: 'slot'});
    input.addEventListener('input', () => {
      const value = numberOrNaN(input);
      if (Number.isNaN(value)) state.errors[inputId] = `숫자를 입력하세요(${spec.min}–${spec.max}, 단위 ${spec.unit}).`;
      else if (value < spec.min || value > spec.max) state.errors[inputId] = `${spec.min} 이상 ${spec.max} 이하의 값을 입력하세요(단위 ${spec.unit}).`;
      else {
        delete state.errors[inputId];
        dispatch({type: 'setInput', field: inputId, value});
      }
      renderSimulation(inputId);
    });
    return h('div', {class: 'field-row'}, h('label', {for: input.id, text: inputLabel(spec)}), input,
      h('span', {class: 'default-note', text: `기본값 ${spec.default}${spec.unit}, 범위 ${spec.min}–${spec.max}`}), errorSlots[inputId]);
  });

  const scenarioButtons = runtime.scenarios.map(scenario => {
    const button = h('button', {type: 'button', testid: `scenario-${scenario.scenarioId}`, onclick: () => {
      state.errors = {};
      dispatch({type: 'applyScenario', scenarioId: scenario.scenarioId});
      renderSimulation();
    }});
    button.dataset.label = `${scenario.label} (${describeInputs(runtime.scenarioInputs(scenario))})`;
    return {id: scenario.scenarioId, button};
  });

  const outputTable = h('div', {class: 'output-tables'});
  const barBox = h('div', {class: 'bar-box', testid: 'output-bars'});
  const previousNote = h('p', {class: 'hint-line'});

  const unitGroups = [...new Set(outputs.map(output => output.unit))].map(unit => ({unit, members: outputs.filter(output => output.unit === unit)}));
  function renderBars(raw, display) {
    barBox.replaceChildren(...unitGroups.map(({unit, members}) => {
      const present = members.filter(output => display[output.outputId] !== null);
      const max = Math.max(0, ...present.map(output => Math.abs(display[output.outputId])));
      return h('section', {class: 'bar-group', 'aria-label': `단위 ${unit} 막대`},
        h('h5', {text: `막대: 단위 ${unit}`}),
        h('ul', {class: 'bar-list'}, present.map(output => {
          const value = display[output.outputId];
          const width = max === 0 ? 0 : Math.abs(value) / max * 100;
          return h('li', {},
            h('span', {class: 'bar-label', text: output.label}),
            h('span', {class: 'bar-track'}, h('span', {class: 'bar', testid: `bar-${output.outputId}`, 'data-value': raw[output.outputId], 'data-width': width, style: `width:${width}%`, role: 'img', 'aria-label': `${output.label} ${formatValue(value)} ${unit}`})),
            h('span', {class: 'bar-value', text: `${formatValue(value)} ${unit}`}));
        })));
    }));
  }

  const renderSimulation = skip => {
    for (const spec of runtime.inputs) {
      const {inputId} = spec;
      const element = inputNodes[inputId];
      if (inputId !== skip && !state.errors[inputId]) element.value = String(state.progress.inputs[inputId]);
      if (state.errors[inputId]) {
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-describedby', `input-error-${inputId}`);
        replaceChildren(errorSlots[inputId], h('p', {class: 'error', id: `input-error-${inputId}`, testid: `input-error-${inputId}`, text: `⚠ ${state.errors[inputId]}`}));
      } else {
        element.removeAttribute('aria-invalid');
        element.removeAttribute('aria-describedby');
        replaceChildren(errorSlots[inputId], null);
      }
    }
    for (const {id, button} of scenarioButtons) {
      const active = state.progress.scenarioId === id;
      button.textContent = `${active ? '✓ ' : ''}${button.dataset.label}`;
      button.setAttribute('aria-pressed', String(active));
    }
    const stale = Object.keys(state.errors).length > 0;
    replaceChildren(slot('stale'), stale ? h('p', {class: 'notice warn', role: 'status', testid: 'stale-output-notice', text: `⚠ 이전 값 표시 중: 잘못된 입력이 있어 마지막 유효 입력(${describeInputs(state.progress.inputs)})의 결과를 보여 줍니다.`}) : null);
    const raw = calculate(state.progress.inputs) ?? state.lastValid;
    state.lastValid = raw;
    const now = displayOf(raw);
    const previousRaw = state.progress.previousInputs ? calculate(state.progress.previousInputs) : null;
    const previous = previousRaw ? displayOf(previousRaw) : null;
    const compare = ({outputId}) => {
      const a = previous[outputId];
      const b = now[outputId];
      if (a === null || b === null) return a === b ? '변화 없음' : '정의 여부가 달라짐';
      return `${b - a > 0 ? '+' : ''}${formatCount(b - a)}`;
    };
    outputTable.replaceChildren(
      table('output-table', `현재 입력(${describeInputs(state.progress.inputs)})의 출력`, ['항목', '현재 값'], fieldRows(output => h('td', {'data-output': output.outputId, text: formatValue(now[output.outputId])}))),
      table('output-previous', previous ? `직전 입력(${describeInputs(state.progress.previousInputs)})의 출력` : '직전 값(아직 입력을 바꾸지 않음)', ['항목', '직전 값'], fieldRows(output => h('td', {'data-output': output.outputId, text: previous ? formatValue(previous[output.outputId]) : '—'}))),
      table('output-change', '전후 변화(현재 − 직전)', ['항목', '변화'], fieldRows(output => h('td', {'data-output': output.outputId, text: previous ? compare(output) : '—'}))));
    previousNote.textContent = previous ? '왼쪽부터 현재 값, 직전 값, 변화입니다. 한 번에 한 입력만 바꾸면 어떤 변화가 결과에 연결되는지 보기 쉽습니다.' : '입력을 바꾸면 변경 직전 값과 비교가 여기에 나타납니다.';
    renderBars(raw, now);
    const present = Object.values(now).filter(value => value !== null);
    replaceChildren(slot('fraction'), present.some(value => !Number.isInteger(value)) ? h('p', {class: 'hint-line', text: NUMBER_NOTES[1]}) : null);
    replaceChildren(slot('undefined-output'), present.length < outputs.length ? h('p', {class: 'notice', role: 'note', text: NUMBER_NOTES[0]}) : null);
    renderHighlight();
  };

  const baselineForm = predictionForm('prediction');
  const baselineRetryForm = predictionForm('prediction-retry');
  const transferRetryForm = predictionForm('transfer-retry');
  const transferForm = predictionForm('transfer');

  const readForm = (form, testid, action, target) => {
    const {values, bad} = form.read();
    if (bad.length) {
      form.showError(testid, `${bad.map(labelOf).join(', ')} 항목에 숫자를 입력하세요. 값은 각 항목의 단위로 입력합니다.`, bad);
      return null;
    }
    const result = dispatch({type: action, target, values});
    if (!result.ok) {
      const ids = result.errors.map(error => error.path.split('/')[2]).filter(Boolean);
      form.showError(testid, ids.length ? '값이 올바르지 않습니다. 유한한 숫자를 입력하세요.' : '지금은 이 작업을 할 수 없습니다. 이미 기록했거나 공개 전입니다.', ids);
      return null;
    }
    form.showError(testid, null, []);
    return result;
  };
  const guarded = (form, testid, type, target) => {
    const result = dispatch({type, target});
    form.showError(testid, result.ok ? null : '지금은 이 작업을 할 수 없습니다. 먼저 예측을 기록하거나 건너뛰세요.', []);
    return result;
  };

  const baselineExtra = h('span', {});
  const baselineSlots = {original: h('div', {class: 'slot'}), comparison: h('div', {class: 'slot'}), retries: h('div', {class: 'slot'})};
  const originalDisplay = (testid, original) => h('div', {class: 'original', testid},
    h('h4', {text: '최초 예측(공개 후 변경할 수 없음)'}),
    original.values === null ? h('p', {text: '건너뜀'}) : h('ul', {class: 'original-fields'}, outputs.map(output =>
      h('li', {'data-output': output.outputId, text: `${output.label}: ${formatPredicted(output, original.values[output.outputId])}`}))));
  const retriesList = (retries, label) => retries.length ? h('div', {class: 'retries'}, h('h4', {text: `${label} 재시도 기록`}), h('ol', {}, retries.map((retry, index) => h('li', {text: `재시도 ${index + 1}(도움: ${HELP_LABELS[retry.help]}): ${outputs.map(output => `${output.label} ${formatPredicted(output, retry.values[output.outputId])}`).join(', ')}`})))) : null;

  const renderBaseline = () => {
    const track = state.progress.baseline;
    const status = predictionState(track);
    baselineForm.lock(status !== 'empty');
    replaceChildren(baselineSlots.original, track.original ? originalDisplay('prediction-original', track.original) : null);
    const context = `${runtime.baselineScenario.label}(${describeInputs(runtime.baselineInputs)}), 결과 공개 전 최초 예측`;
    const simulating = STAGES.indexOf(state.progress.stage) >= STAGES.indexOf('simulation');
    baselineExtra.replaceChildren(...(simulating ? [revealButton, ...(track.revealed ? [baselineRetryForm.node, baselineButtons.retry] : [])] : []));
    replaceChildren(baselineSlots.comparison, simulating && track.revealed ? h('div', {testid: 'baseline-comparison'},
      comparisonTable('baseline-comparison-table', `${runtime.baselineScenario.label} 계산 결과와 최초 예측`, track.original.values, runtime.baselineExpected),
      feedback(context, gradeTransferPrediction(track.original.values, runtime.baselineExpected, lesson))) : null);
    replaceChildren(baselineSlots.retries, retriesList(track.retries, runtime.baselineScenario.label));
  };

  const hintLines = level => lesson.concepts.map(concept => `${concept.label.split(':')[0]}: ${level === 1 ? concept.confusion : concept.plain}`);
  const hintButtons = Array.from({length: HINT_LEVELS}, (_, index) => h('button', {type: 'button', testid: `hint-level-${index + 1}`, onclick: () => {
    dispatch({type: 'openHint', level: index + 1});
    renderTransfer();
  }, text: `힌트 ${index + 1}단계`}));
  const helpSelect = h('select', {id: 'help-level', testid: 'help-level'}, HELP_LEVELS.map(level => h('option', {value: level, text: HELP_LABELS[level]})));
  helpSelect.addEventListener('change', () => {
    dispatch({type: 'setHelp', level: helpSelect.value});
    renderTransfer();
  });
  const transferSlots = {hints: h('div', {class: 'slot'}), original: h('div', {class: 'slot'}), result: h('div', {class: 'slot'}), retries: h('div', {class: 'slot'}), calc: h('div', {class: 'slot'}), retryEntry: h('div', {class: 'slot'})};

  const renderTransfer = () => {
    const {transfer, hintDepth, help} = state.progress;
    helpSelect.value = help;
    hintButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(hintDepth === index + 1)));
    replaceChildren(transferSlots.hints, hintDepth ? h('div', {class: 'hints'}, Array.from({length: hintDepth}, (_, index) =>
      h('div', {testid: `hint-text-${index + 1}`}, h('strong', {text: `힌트 ${index + 1}단계: `}), h('ul', {}, hintLines(index + 1).map(line => h('li', {text: line})))))) : null);
    transferForm.lock(transfer.original !== null);
    transferSlots.retryEntry.replaceChildren(...(transfer.revealed ? [transferRetryForm.node, transferButtons.retry] : []));
    replaceChildren(transferSlots.original, transfer.original ? originalDisplay('transfer-original', transfer.original) : null);
    replaceChildren(transferSlots.calc, transfer.calculationError ? h('div', {role: 'alert', class: 'notice warn', testid: 'transfer-calculation-error'},
      h('p', {text: '⚠ 계산 도구 실패: 새 사례 결과를 계산하지 못했습니다. 이 실패는 이해 부족으로 판정하지 않으며 판정은 보류됩니다.'}), statusLine('pending')) : null);
    if (transfer.revealed) {
      const grade = gradeTransferPrediction(transfer.original.values, runtime.transferExpected, lesson);
      const context = `${runtime.transferScenario.label}(${describeInputs(transfer.inputs)}), 결과 공개 전 최초 예측, 도움 ${HELP_LABELS[transfer.original.help]}`;
      replaceChildren(transferSlots.result, h('div', {class: 'result', testid: 'transfer-result'},
        h('h3', {text: '새 사례 결과'}),
        statusLine(grade.status),
        comparisonTable('transfer-result-table', `새 사례 계산 결과와 최초 예측(${describeInputs(transfer.inputs)})`, transfer.original.values, runtime.transferExpected),
        feedback(context, grade),
        h('p', {class: 'hint-line', text: OBSERVATION_NOTICE}),
        h('p', {class: 'hint-line', text: NUMBER_NOTES[0]})));
    } else replaceChildren(transferSlots.result, null);
    replaceChildren(transferSlots.retries, retriesList(transfer.retries, '새 사례'));
  };

  const responseNodes = Object.fromEntries(FREE_KINDS.map(kind => {
    const labels = {question: '질문 만들기: 선택을 바꿀 정보를 agent에게 어떻게 물을까요? 그 질문이 선택에 필요한 이유도 적어 보세요.', choice: '선택 이유: 이 수업의 선택지 중 무엇을 잠정 선택하거나 보류하나요? 유리한 조건과 실패 조건을 함께 적어 보세요.', apply: '‘내 상황에 적용’: 내 작업에 비슷한 선택이 있나요? 모르는 조건은 채우지 말고 질문으로 남겨 두세요.'};
    const area = h('textarea', {id: `response-${kind}`, rows: 4, testid: `response-${kind}`});
    const status = h('span', {class: 'hint-line', role: 'status'});
    area.addEventListener('input', () => {
      dispatch({type: 'recordFreeResponse', kind, answer: area.value});
      renderResponses(kind);
    });
    const skip = h('button', {type: 'button', testid: `response-skip-${kind}`, text: '건너뛰기', onclick: () => {
      dispatch({type: 'recordFreeResponse', kind, answer: null});
      renderResponses();
    }});
    return [kind, {area, status, node: h('div', {class: 'field-block'}, h('label', {for: area.id, text: labels[kind]}), area, h('div', {}, skip, ' ', status))}];
  }));
  const renderResponses = skipKind => {
    for (const kind of FREE_KINDS) {
      const entry = state.progress.responses[kind];
      const {area, status} = responseNodes[kind];
      if (kind !== skipKind) area.value = entry && entry.text !== null ? entry.text : '';
      status.textContent = entry === null ? '' : entry.text === null ? '– 건너뜀' : `✓ 저장됨(도움: ${HELP_LABELS[entry.help]})`;
    }
  };

  const lessonState = h('p', {class: 'lesson-state', role: 'status'});
  const renderFinish = () => {
    const done = state.progress.completed;
    lessonState.textContent = `${done ? '● 완료(completed)' : '◐ 진행 중(partial)'}: 언제든 지금까지의 결과를 내보낼 수 있습니다. 완료 버튼은 수행 증거가 아닙니다.`;
    replaceChildren(slot('export-error'), state.exportError ? h('p', {class: 'error', role: 'alert', testid: 'export-error', text: `⚠ ${EXPORT_BLOCKED_NOTICE} ${state.exportError}`})
      : state.exportSubmitError ? h('p', {class: 'error', role: 'alert', testid: 'export-error', text: `⚠ ${EXPORT_SUBMIT_FAILED_NOTICE} ${state.exportSubmitError}`}) : null);
    replaceChildren(slot('export-status'), state.exportSubmitted ? h('p', {class: 'notice', role: 'status', testid: 'export-status', text: EXPORT_SUBMITTED_NOTICE}) : null);
    const kind = state.saveFailed || state.loadNotice === 'unavailable' ? 'unavailable' : state.loadNotice;
    replaceChildren(slot('storage'), kind ? h('p', {class: 'notice warn', role: 'status', testid: 'storage-notice', 'data-kind': kind, text: `⚠ ${STORAGE_NOTICES[kind]}`}) : null);
    replaceChildren(slot('reset'), state.confirmReset ? h('div', {class: 'notice', role: 'alertdialog', 'aria-label': '학습 초기화 확인'},
      h('p', {text: '저장된 입력·예측·응답·힌트 기록을 모두 지우고 처음 상태로 돌아갑니다. 이미 제출한 결과는 지워지지 않습니다.'}),
      h('button', {type: 'button', testid: 'reset-learning-confirm', onclick: resetLearning, text: '네, 학습을 초기화합니다'}), ' ',
      h('button', {type: 'button', testid: 'reset-learning-cancel', onclick: () => {
        state.confirmReset = false;
        renderFinish();
        resetButton.focus();
      }, text: '취소'})) : null);
  };

  const resetButton = h('button', {type: 'button', testid: 'reset-learning', onclick: () => {
    state.confirmReset = true;
    renderFinish();
    document.querySelector('[data-testid="reset-learning-confirm"]').focus();
  }, text: '학습 초기화'});

  function resetLearning() {
    try {
      storage.removeItem(storageKey(state.progress));
    } catch {
      state.saveFailed = true;
    }
    const fresh = loadProgress({getItem: () => null}, session, runtime).progress;
    Object.assign(state, {progress: fresh, errors: {}, confirmReset: false, exportError: null, exportSubmitted: false, exportSubmitError: null, highlight: null, loadNotice: state.loadNotice === 'unavailable' ? 'unavailable' : null});
    for (const form of [baselineForm, transferForm, baselineRetryForm, transferRetryForm]) form.write(null);
    baselineForm.showError('prediction-error', null, []);
    transferForm.showError('transfer-error', null, []);
    renderAll();
    resetButton.focus();
  }

  const exportResult = async () => {
    state.exportError = null;
    state.exportSubmitted = false;
    state.exportSubmitError = null;
    let document_;
    try {
      document_ = await finalizeResult(buildResult(state.progress, lesson, session, new Date(), runtime));
    } catch (error) {
      state.exportError = String(error.message);
    }
    if (document_) {
      const shape = validateResultShape(document_);
      if (!shape.ok) state.exportError = shape.errors.map(error => `${error.code} ${error.path || '/'}`).join(', ');
      else {
        try {
          const response = await fetch('/__ltt/result', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(document_, null, 2)});
          if (response.status === 200) state.exportSubmitted = true;
          else state.exportSubmitError = await response.json().then(body => String(body.code), () => 'NETWORK');
        } catch {
          state.exportSubmitError = 'NETWORK';
        }
      }
    }
    renderFinish();
  };

  const contentById = new Map(lesson.content.map(item => [item.contentId, item]));
  const activityContents = stage => lesson.activities.filter(item => item.stage === stage).flatMap(item => item.contentIds.map(id => contentById.get(id)));
  const contentParagraphs = items => items.map(item => h('p', {testid: `content-${item.contentId}`, text: item.text}));

  const exploration = activityContents('exploration');
  const firstExplanation = exploration.find(item => item.role === 'explanation');
  const explanationParagraph = firstExplanation ? h('p', {id: 'explanation-content', tabindex: '-1', testid: 'explanation-content', text: firstExplanation.text}) : null;
  const toExplanation = h('a', {href: '#explanation-content', id: 'link-to-explanation', testid: 'link-to-explanation', text: '이 결과의 원리 설명으로 이동 →'});
  const backLink = h('a', {href: '#sec-simulation', testid: 'link-back-to-simulation', text: '← 시뮬레이션으로 돌아가기(입력·예측 유지)'});
  toExplanation.addEventListener('click', event => {
    event.preventDefault();
    state.returnY = window.scrollY;
    state.highlight = 'explanation';
    renderHighlight();
    explanationParagraph.scrollIntoView();
    explanationParagraph.focus({preventScroll: true});
  });
  backLink.addEventListener('click', event => {
    event.preventDefault();
    state.highlight = 'simulation';
    renderHighlight();
    window.scrollTo(0, state.returnY);
    toExplanation.focus({preventScroll: true});
  });
  function renderHighlight() {
    if (explanationParagraph) {
      if (state.highlight === 'explanation') explanationParagraph.setAttribute('data-highlighted', 'true');
      else explanationParagraph.removeAttribute('data-highlighted');
    }
    for (const inputId of runtime.inputIds) {
      if (state.highlight) inputNodes[inputId].setAttribute('data-highlighted', 'true');
      else inputNodes[inputId].removeAttribute('data-highlighted');
    }
  }

  const decisionCards = lesson.decisions.map(decision => h('section', {class: 'choice-card', testid: `decision-${decision.decisionId}`, 'aria-label': decision.question},
    h('h4', {text: decision.question}),
    h('p', {}, h('strong', {text: '선택지'})), h('ul', {}, decision.choices.map(choice => h('li', {text: choice}))),
    h('p', {}, h('strong', {text: '먼저 확인할 정보'})), h('ul', {}, decision.requiredInformation.map(info => h('li', {text: info})))));

  const completeButton = h('button', {type: 'button', testid: 'complete-lesson', onclick: () => {
    dispatch({type: 'completeLesson'});
    renderFinish();
  }, text: '학습 완료로 표시'});

  const wire = (form, retryForm, prefix, errorId, target) => {
    const record = h('button', {type: 'button', testid: `${prefix}-record`, text: '예측 기록', onclick: () => {
      if (readForm(form, errorId, 'recordPrediction', target)) renderAll();
    }});
    const skip = h('button', {type: 'button', testid: `${prefix}-skip`, text: '건너뛰기', onclick: () => {
      guarded(form, errorId, 'skipPrediction', target);
      renderAll();
    }});
    const retry = h('button', {type: 'button', testid: `${prefix}-retry`, text: '다시 시도(새 응답으로 기록)', onclick: () => {
      if (readForm(retryForm, `${prefix}-retry-error`, 'retryPrediction', target)) {
        retryForm.write(null);
        renderAll();
      }
    }});
    return {record, skip, retry};
  };
  const baselineButtons = wire(baselineForm, baselineRetryForm, 'prediction', 'prediction-error', 'baseline');
  const transferButtons = wire(transferForm, transferRetryForm, 'transfer', 'transfer-error', 'transfer');
  const revealButton = h('button', {type: 'button', testid: 'prediction-reveal', text: '결과와 비교 공개', onclick: () => {
    guarded(baselineForm, 'prediction-error', 'reveal', 'baseline');
    renderAll();
  }});

  const section = (id, title, ...children) => h('section', {id, 'aria-labelledby': `${id}-title`}, h('h3', {id: `${id}-title`, text: title}), ...children);

  const conceptSection = section('sec-concepts', '핵심 용어', h('p', {text: '용어를 눌러 뜻·예·혼동하기 쉬운 뜻을 볼 수 있습니다.'}), h('ul', {class: 'concept-list'}, conceptButtons.map(({trigger, cardSlot}) => h('li', {}, trigger, cardSlot))));
  const baselineBlock = h('div', {testid: 'baseline-prediction'},
    h('p', {text: `${runtime.baselineScenario.label}(${describeInputs(runtime.baselineInputs)})에서 아래 ${outputs.length}개 값을 예상해 보세요. 최초 예측은 기록하면 바꿀 수 없고, 건너뛰어도 됩니다. 값은 각 항목의 단위로 입력합니다.`}),
    baselineForm.node, h('div', {class: 'buttons'}, baselineButtons.record, baselineButtons.skip, baselineExtra),
    baselineSlots.original, baselineSlots.comparison, baselineSlots.retries);
  const simulationBlock = section('sec-simulation', '입력을 바꿔 보기', ...contentParagraphs(exploration.filter(item => item.role === 'simulation')),
    h('div', {class: 'buttons', role: 'group', 'aria-label': '시나리오'}, scenarioButtons.map(item => item.button), h('button', {type: 'button', testid: 'reset-inputs', text: '입력 초기화', onclick: () => {
      state.errors = {};
      dispatch({type: 'resetInputs'});
      renderSimulation();
    }})),
    h('p', {class: 'hint-line', text: `초기화 범위: 입력만 기본값(${describeInputs(runtime.defaultInputs)})으로 되돌립니다. 예측·응답·힌트 기록은 지우지 않습니다.`}),
    inputRows, slot('stale'), outputTable, previousNote, slot('undefined-output'), slot('fraction'),
    h('div', {class: 'bar-section'}, h('h4', {text: '출력 막대'}), barBox,
      h('p', {class: 'hint-line', text: '막대는 같은 단위끼리 가장 큰 절댓값을 100%로 비교합니다. 값은 위의 표와 막대 옆 숫자로도 읽을 수 있습니다.'})),
    ...(firstExplanation ? [h('p', {}, toExplanation)] : []));
  const explanationBlock = section('sec-explanation', '원리와 설명', ...(firstExplanation ? [explanationParagraph] : []),
    ...contentParagraphs(exploration.filter(item => item !== firstExplanation && item.role !== 'simulation')),
    ...(firstExplanation ? [h('p', {}, backLink)] : []));
  const choiceBlock = section('sec-choice', '선택 비교', h('p', {text: '아래 카드는 정답을 제시하지 않고, 각 선택에 필요한 정보를 같은 형식으로 보입니다. 정보가 부족하면 보류도 선택지입니다.'}), h('div', {class: 'choice-pair'}, decisionCards));
  const transferBlock = h('div', {testid: 'transfer-prediction'},
    h('p', {text: `${runtime.transferScenario.label}(${describeInputs(runtime.transferInputs)}). 위의 설명과 이전 결과를 가린 채 ${outputs.length}개 값을 예상하세요. 기록하거나 건너뛰면 결과가 나타납니다.`}),
    h('div', {class: 'help-box'}, h('p', {text: '막히면 필요한 만큼만 힌트를 펼치세요. 도움은 벌점이 아니며 기록됩니다. 힌트를 본 사실만으로 수행이 인정되지는 않습니다.'}),
      h('div', {class: 'buttons', role: 'group', 'aria-label': '힌트 단계'}, hintButtons), transferSlots.hints,
      h('div', {class: 'field-row'}, h('label', {for: 'help-level', text: '도움 수준(결과에 기록됨)'}), helpSelect)),
    transferForm.node, h('div', {class: 'buttons'}, transferButtons.record, transferButtons.skip), transferSlots.retryEntry,
    transferSlots.original, transferSlots.calc, transferSlots.result, transferSlots.retries);
  const responsesBlock = section('sec-responses', '내 질문·선택·적용', h('p', {text: '정해진 문장과 맞는지가 아니라, 어떤 정보가 선택을 바꾸는지와 그 이유를 봅니다. 자유 응답은 agent가 나중에 검토하며 이 화면은 채점하지 않습니다.'}), FREE_KINDS.map(kind => responseNodes[kind].node));

  const STAGE_TITLES = {context: '맥락', prediction: '기본 예측', simulation: '조작과 비교', assessment: '새 사례 확인', return: '작업으로 돌아가기', map: '정리와 다음 학습'};
  const STAGE_BODIES = {
    context: () => contentParagraphs(activityContents('orientation')),
    prediction: () => [conceptSection, baselineBlock],
    simulation: () => [conceptSection, baselineBlock, simulationBlock, explanationBlock, choiceBlock],
    assessment: () => [conceptSection, ...contentParagraphs(activityContents('assessment')), transferBlock, responsesBlock],
    return: () => contentParagraphs(activityContents('return')),
    map: () => [...contentParagraphs(activityContents('map')), lessonState, h('div', {class: 'buttons'}, completeButton)],
  };

  const stageHost = h('div', {});
  const stageIndicator = h('p', {class: 'stage-indicator', role: 'status', testid: 'stage-indicator'});
  const backButton = h('button', {type: 'button', testid: 'stage-back', text: '← 이전 단계', onclick: () => {
    const current = STAGES.indexOf(state.progress.stage);
    dispatch({type: 'goToStage', stage: STAGES[current - 1]});
    renderAll();
    focusStage();
  }});
  const nextButton = h('button', {type: 'button', testid: 'stage-next', text: '다음 단계 →', onclick: () => {
    const result = dispatch({type: 'advanceStage'});
    state.stageError = result.ok ? null : '기본 예측을 기록하거나 건너뛰어야 다음 단계로 갈 수 있습니다.';
    renderAll();
    if (result.ok) focusStage();
  }});
  const navButtons = h('span', {});
  function focusStage() {
    const heading = stageHost.querySelector('h2');
    heading.focus();
    window.scrollTo(0, 0);
  }
  let renderedStage = null;
  const renderStage = () => {
    const name = state.progress.stage;
    const index = STAGES.indexOf(name);
    if (renderedStage !== name) {
      renderedStage = name;
      stageHost.replaceChildren(h('section', {testid: `stage-${name}`, 'aria-labelledby': 'stage-title'},
        h('h2', {id: 'stage-title', tabindex: '-1', text: `${index + 1}. ${STAGE_TITLES[name]}`}), ...STAGE_BODIES[name]()));
    }
    stageIndicator.textContent = `${index + 1}/${STAGES.length} 단계: ${STAGE_TITLES[name]}`;
    navButtons.replaceChildren(...(index > 0 ? [backButton] : []), ...(index < STAGES.length - 1 ? [nextButton] : []));
    replaceChildren(slot('stage-error'), state.stageError ? h('p', {class: 'error', role: 'alert', testid: 'stage-error', text: `⚠ ${state.stageError}`}) : null);
    state.stageError = null;
  };

  const app = document.getElementById('app');
  app.replaceChildren(
    h('h1', {text: 'Learn to Tell 수업'}),
    h('p', {class: 'notice', role: 'note', testid: 'safety-notice', text: SAFETY_NOTICE}),
    stageIndicator, stageHost, h('div', {class: 'buttons'}, navButtons), slot('stage-error'),
    h('section', {'aria-labelledby': 'finish-title'}, h('h2', {id: 'finish-title', text: '결과 내보내기와 저장'}),
      h('div', {class: 'buttons'}, h('button', {type: 'button', testid: 'export-result', onclick: exportResult, text: '결과 제출'}), resetButton),
      h('p', {class: 'notice', role: 'note', testid: 'export-notice', text: EXPORT_NOTICE}), slot('export-error'), slot('export-status'), slot('storage'), slot('reset')));

  const renderAll = () => {
    renderStage();
    renderConcepts();
    renderSimulation();
    renderBaseline();
    renderTransfer();
    renderResponses();
    renderFinish();
    renderHighlight();
  };
  baselineForm.write(state.progress.baseline.original ? state.progress.baseline.original.values : null);
  transferForm.write(state.progress.transfer.original ? state.progress.transfer.original.values : null);
  renderAll();
}
