import {calculateInspection} from '../examples/manufacturing-inspection/model.mjs';
import {inspectionLesson, inspectionScenarios} from '../examples/manufacturing-inspection/lesson.mjs';
import {inspectionAssessmentGuide} from '../examples/manufacturing-inspection/assessment-guide.mjs';
import {applyAction, DEFAULT_INPUTS, FREE_KINDS, HELP_LEVELS, INPUT_FIELDS, STAGES, predictionState} from '../learning/progress.mjs';
import {COUNT_FIELDS, PREDICTION_FIELDS, gradeTransferPrediction} from '../learning/grading.mjs';
import {buildResult, finalizeResult, validateResultShape} from '../learning/result.mjs';
import {loadProgress, saveProgress, storageKey} from '../learning/storage.mjs';
import {formatCount, formatRatio} from '../learning/format.mjs';
import {h, replaceChildren} from './dom.js';
import {createGrid} from './grid.js';
import {CONCEPT_CARDS, EXPORT_BLOCKED_NOTICE, EXPORT_NOTICE, FIELD_LABELS, HELP_LABELS, INPUT_LABELS, NUMBER_NOTES, OBSERVATION_NOTICE, SAFETY_NOTICE, STATUS_LABELS, STORAGE_NOTICES} from './content.js';

const formatField = (field, value) => COUNT_FIELDS.includes(field) ? formatCount(value) : formatRatio(value);
const formatPredicted = (field, value) => value === null ? '정의되지 않음' : COUNT_FIELDS.includes(field) ? formatCount(value) : `${formatCount(value)}%`;
const scenarioInputs = id => inspectionScenarios.find(item => item.scenarioId === id).inputs;
const describeInputs = inputs => `결함 ${inputs.defectPercent}% · 검출 ${inputs.detectionPercent}% · 오탐 ${inputs.falsePositivePercent}%`;
const calculated = inputs => calculateInspection(inputs).value;
const numberOrNaN = element => element.validity.badInput || element.value.trim() === '' ? Number.NaN : Number(element.value);

function table(testid, caption, head, rows) {
  return h('table', {testid},
    h('caption', {text: caption}),
    h('thead', {}, h('tr', {}, head.map(label => h('th', {scope: 'col', text: label})))),
    h('tbody', {}, rows));
}

function fieldRows(cellFor) {
  return PREDICTION_FIELDS.map(field => h('tr', {}, h('th', {scope: 'row', text: FIELD_LABELS[field]}), cellFor(field)));
}

function predictionForm(prefix) {
  const inputs = {};
  const rows = PREDICTION_FIELDS.map(field => {
    const ratio = !COUNT_FIELDS.includes(field);
    const id = `${prefix}-${field}`;
    inputs[field] = h('input', {id, type: 'number', step: 'any', min: 0, max: ratio ? 100 : null, inputmode: 'decimal', testid: id});
    return h('div', {class: 'field-row'}, h('label', {for: id, text: `${FIELD_LABELS[field]} (${ratio ? '%' : '개'})`}), inputs[field]);
  });
  const undefinedBox = h('input', {type: 'checkbox', id: `${prefix}-ppv-undefined`, testid: `${prefix}-ppv-undefined`});
  const syncUndefined = () => {
    if (undefinedBox.checked) inputs.positivePredictiveValue.value = '';
    inputs.positivePredictiveValue.disabled = undefinedBox.checked || undefinedBox.disabled;
  };
  undefinedBox.addEventListener('change', syncUndefined);
  const errorSlot = h('div', {class: 'slot'});
  return {
    node: h('div', {class: 'prediction-fields'}, rows, h('div', {class: 'field-row'}, undefinedBox, h('label', {for: undefinedBox.id, text: '양성이 0개일 것 같아 PPV는 “정의되지 않음”으로 답함'})), errorSlot),
    read() {
      const values = {};
      const bad = [];
      for (const field of PREDICTION_FIELDS) {
        if (field === 'positivePredictiveValue' && undefinedBox.checked) values[field] = null;
        else if (Number.isNaN(numberOrNaN(inputs[field]))) bad.push(field);
        else values[field] = numberOrNaN(inputs[field]);
      }
      return {values, bad};
    },
    write(values) {
      for (const field of PREDICTION_FIELDS) inputs[field].value = values && values[field] !== null ? String(values[field]) : '';
      undefinedBox.checked = values !== null && values.positivePredictiveValue === null;
      syncUndefined();
    },
    lock(locked) {
      for (const input of Object.values(inputs)) input.disabled = locked;
      undefinedBox.disabled = locked;
      syncUndefined();
    },
    showError(testid, message, fields) {
      for (const field of PREDICTION_FIELDS) {
        if (fields.includes(field)) inputs[field].setAttribute('aria-invalid', 'true');
        else inputs[field].removeAttribute('aria-invalid');
      }
      replaceChildren(errorSlot, message ? h('p', {class: 'error', role: 'alert', testid, text: `⚠ ${message}`}) : null);
    },
  };
}

function statusLine(status) {
  const [icon, label, code] = STATUS_LABELS[status];
  return h('p', {class: `grade grade-${status}`, testid: 'transfer-grade', 'data-status': status}, h('span', {'aria-hidden': 'true', text: `${icon} `}), `${label} (${code})`);
}

function feedback(context, grade) {
  const total = PREDICTION_FIELDS.length;
  const mismatched = grade.mismatched.map(field => FIELD_LABELS[field]).join(', ');
  let fact;
  let support;
  if (grade.status === 'skipped') {
    fact = `${context}에서 예측을 건너뛰었습니다. 이번 조건에서는 예측 수행이 관찰되지 않았습니다.`;
    support = '결과는 그대로 볼 수 있고, 준비되면 최초 기록을 남긴 채 다시 시도할 수 있습니다.';
  } else if (grade.status === 'supported') {
    fact = `${context}에서 ${total}개 항목이 모두 허용 오차(개수 ±1, 비율 ±1%p) 안에서 일치했습니다. 조건이 바뀌면 다시 확인합니다.`;
    support = '확인된 부분을 바탕으로 다음 선택을 함께 살펴볼 수 있습니다.';
  } else {
    fact = `${context}에서 ${grade.matched.length}/${total}개 항목이 일치했고, 예측과 다른 결과가 나온 항목은 ${mismatched}입니다.`;
    support = '다른 항목 하나부터 같이 보겠습니다. 필요하면 힌트 단계를 고르거나 최초 예측을 남긴 채 다시 시도하고, 보류해도 됩니다.';
  }
  return h('div', {class: 'feedback'}, h('p', {}, h('strong', {text: '관찰한 사실(A): '}), fact), h('p', {}, h('strong', {text: '다음 행동(B): '}), support));
}

function comparisonTable(testid, caption, values, expected) {
  const grade = gradeTransferPrediction(values, expected);
  return table(testid, caption, ['항목', '최초 예측', '계산 결과', '허용 오차 비교'], fieldRows(field => [
    h('td', {text: values === null ? '건너뜀' : formatPredicted(field, values[field])}),
    h('td', {'data-field': field, text: formatField(field, expected[field])}),
    h('td', {text: values === null ? '–' : grade.matched.includes(field) ? '✓ 일치' : '✕ 차이 있음'}),
  ]));
}

export function mount(session) {
  document.documentElement.lang = 'ko';
  // The Framework template pins maximum-scale=1, which blocks user zoom.
  document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1');
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  const loaded = loadProgress(storage, session);
  const state = {progress: loaded.progress, loadNotice: loaded.notice, saveFailed: false, errors: {}, openConcept: null, confirmReset: false, exportError: null, highlight: null, returnY: 0};
  const baselineInputs = scenarioInputs('baseline-a');
  const baselineExpected = calculated(baselineInputs);
  const transferCase = inspectionAssessmentGuide.transferCase;

  const dispatch = action => {
    const result = applyAction(state.progress, {...action, at: new Date().toISOString()});
    if (result.ok) {
      state.progress = result.progress;
      state.saveFailed = !saveProgress(storage, state.progress).ok;
      renderFinish();
    }
    return result;
  };

  const grid = createGrid();
  const slots = {};
  const slot = name => slots[name] ??= h('div', {class: 'slot'});

  const conceptButtons = inspectionLesson.concepts.map(concept => {
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
      const card = CONCEPT_CARDS[concept.conceptId];
      replaceChildren(cardSlot, open ? h('section', {class: 'concept-card', testid: `concept-card-${concept.conceptId}`, 'aria-label': `${concept.label} 개념 카드`},
        h('p', {}, h('strong', {text: '뜻: '}), card.meaning), h('p', {}, h('strong', {text: '예: '}), card.example),
        h('p', {}, h('strong', {text: '혼동하기 쉬운 뜻: '}), card.confusion), h('p', {}, h('strong', {text: '평문 수식: '}), card.plain),
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
  const inputRows = INPUT_FIELDS.map(field => {
    const {suffix, label} = INPUT_LABELS[field];
    const input = h('input', {id: `input-${suffix}`, type: 'number', step: 'any', min: 0, max: 100, inputmode: 'decimal', testid: `input-${suffix}`});
    inputNodes[field] = input;
    errorSlots[field] = h('div', {class: 'slot'});
    input.addEventListener('input', () => {
      const value = numberOrNaN(input);
      if (Number.isNaN(value)) state.errors[field] = '숫자를 입력하세요(0–100, 단위 %).';
      else if (value < 0 || value > 100) state.errors[field] = '0 이상 100 이하의 값을 입력하세요(단위 %).';
      else {
        delete state.errors[field];
        dispatch({type: 'setInput', field, value});
      }
      renderSimulation(field);
    });
    return h('div', {class: 'field-row'}, h('label', {for: input.id, text: `${label} (%)`}), input,
      h('span', {class: 'default-note', text: `기본값 ${DEFAULT_INPUTS[field]}%, 범위 0–100`}), errorSlots[field]);
  });

  const scenarioButtons = [['baseline-a', '기본 A'], ['population-contrast', '대비: 결함 많은 집단'], ['candidate-b', '후보 B']].map(([id, label]) => {
    const button = h('button', {type: 'button', testid: `scenario-${id}`, onclick: () => {
      state.errors = {};
      dispatch({type: 'applyScenario', scenarioId: id});
      renderSimulation();
    }});
    button.dataset.label = `${label} (${describeInputs(scenarioInputs(id))})`;
    return {id, button};
  });

  const outputTable = h('div', {class: 'output-tables'});
  const previousNote = h('p', {class: 'hint-line'});

  const renderSimulation = skip => {
    for (const field of INPUT_FIELDS) {
      const element = inputNodes[field];
      if (field !== skip && !state.errors[field]) element.value = String(state.progress.inputs[field]);
      const {suffix} = INPUT_LABELS[field];
      if (state.errors[field]) {
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-describedby', `input-error-${suffix}`);
        replaceChildren(errorSlots[field], h('p', {class: 'error', id: `input-error-${suffix}`, testid: `input-error-${suffix}`, text: `⚠ ${state.errors[field]}`}));
      } else {
        element.removeAttribute('aria-invalid');
        element.removeAttribute('aria-describedby');
        replaceChildren(errorSlots[field], null);
      }
    }
    for (const {id, button} of scenarioButtons) {
      const active = state.progress.scenarioId === id;
      button.textContent = `${active ? '✓ ' : ''}${button.dataset.label}`;
      button.setAttribute('aria-pressed', String(active));
    }
    const stale = Object.keys(state.errors).length > 0;
    replaceChildren(slot('stale'), stale ? h('p', {class: 'notice warn', role: 'status', testid: 'stale-output-notice', text: `⚠ 이전 값 표시 중: 잘못된 입력이 있어 마지막 유효 입력(${describeInputs(state.progress.inputs)})의 결과를 보여 줍니다.`}) : null);
    const now = calculated(state.progress.inputs);
    const previous = state.progress.previousInputs ? calculated(state.progress.previousInputs) : null;
    const compare = (field, a, b) => a[field] === null || b[field] === null ? (a[field] === b[field] ? '변화 없음' : '정의 여부가 달라짐') : COUNT_FIELDS.includes(field) ? `${b[field] - a[field] > 0 ? '+' : ''}${formatCount(b[field] - a[field])}` : `${b[field] - a[field] > 0 ? '+' : ''}${((b[field] - a[field]) * 100).toFixed(2)}%p`;
    outputTable.replaceChildren(
      table('output-table', `현재 입력(${describeInputs(state.progress.inputs)})의 출력`, ['항목', '현재 값'], fieldRows(field => h('td', {'data-field': field, text: formatField(field, now[field])}))),
      table('output-previous', previous ? `직전 입력(${describeInputs(state.progress.previousInputs)})의 출력` : '직전 값(아직 입력을 바꾸지 않음)', ['항목', '직전 값'], fieldRows(field => h('td', {'data-field': field, text: previous ? formatField(field, previous[field]) : '—'}))),
      table('output-change', '전후 변화(현재 − 직전)', ['항목', '변화'], fieldRows(field => h('td', {'data-field': field, text: previous ? compare(field, previous, now) : '—'}))));
    previousNote.textContent = previous ? '왼쪽부터 현재 값, 직전 값, 변화입니다. 한 번에 한 비율만 바꾸면 어떤 변화가 결과에 연결되는지 보기 쉽습니다.' : '입력을 바꾸면 변경 직전 값과 비교가 여기에 나타납니다.';
    grid.update(now, formatCount, field => FIELD_LABELS[field]);
    const fractional = Object.values(now).some(value => typeof value === 'number' && !Number.isInteger(value));
    replaceChildren(slot('fraction'), fractional ? h('p', {class: 'hint-line', text: NUMBER_NOTES[1]}) : null);
    if (now.positivePredictiveValue === null) replaceChildren(slot('undefined-ppv'), h('p', {class: 'notice', role: 'note', text: NUMBER_NOTES[0]}));
    else replaceChildren(slot('undefined-ppv'), null);
    renderHighlight();
  };

  const baselineForm = predictionForm('prediction');
  const baselineRetryForm = predictionForm('prediction-retry');
  const transferRetryForm = predictionForm('transfer-retry');
  const transferForm = predictionForm('transfer');

  const readForm = (form, testid, action, target) => {
    const {values, bad} = form.read();
    if (bad.length) {
      form.showError(testid, `${bad.map(field => FIELD_LABELS[field]).join(', ')} 항목에 숫자를 입력하세요. 비율은 % 단위입니다.`, bad);
      return null;
    }
    const result = dispatch({type: action, target, values});
    if (!result.ok) {
      const fields = result.errors.map(error => error.path.split('/')[2]).filter(Boolean);
      form.showError(testid, fields.length ? '값이 범위를 벗어났습니다. 개수는 0 이상, 비율은 0–100%입니다.' : '지금은 이 작업을 할 수 없습니다. 이미 기록했거나 공개 전입니다.', fields);
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
    original.values === null ? h('p', {text: '건너뜀'}) : h('ul', {class: 'original-fields'}, PREDICTION_FIELDS.map(field =>
      h('li', {'data-field': field, text: `${FIELD_LABELS[field]}: ${formatPredicted(field, original.values[field])}`}))));
  const retriesList = (retries, label) => retries.length ? h('div', {class: 'retries'}, h('h4', {text: `${label} 재시도 기록`}), h('ol', {}, retries.map((retry, index) => h('li', {text: `재시도 ${index + 1}(도움: ${HELP_LABELS[retry.help]}): ${PREDICTION_FIELDS.map(field => `${FIELD_LABELS[field]} ${formatPredicted(field, retry.values[field])}`).join(', ')}`})))) : null;

  const renderBaseline = () => {
    const track = state.progress.baseline;
    const status = predictionState(track);
    baselineForm.lock(status !== 'empty');
    replaceChildren(baselineSlots.original, track.original ? originalDisplay('prediction-original', track.original) : null);
    const context = `기본 A(${describeInputs(baselineInputs)}), 결과 공개 전 최초 예측`;
    const simulating = STAGES.indexOf(state.progress.stage) >= STAGES.indexOf('simulation');
    baselineExtra.replaceChildren(...(simulating ? [revealButton, ...(track.revealed ? [baselineRetryForm.node, baselineButtons.retry] : [])] : []));
    replaceChildren(baselineSlots.comparison, simulating && track.revealed ? h('div', {testid: 'baseline-comparison'},
      comparisonTable('baseline-comparison-table', '기본 A 계산 결과와 최초 예측', track.original.values, baselineExpected),
      feedback(context, gradeTransferPrediction(track.original.values, baselineExpected))) : null);
    replaceChildren(baselineSlots.retries, retriesList(track.retries, '기본 A'));
  };

  const hintButtons = inspectionAssessmentGuide.hints.map(hint => h('button', {type: 'button', testid: `hint-level-${hint.level}`, onclick: () => {
    dispatch({type: 'openHint', level: hint.level});
    renderTransfer();
  }, text: `힌트 ${hint.level}단계`}));
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
    replaceChildren(transferSlots.hints, hintDepth ? h('div', {class: 'hints'}, inspectionAssessmentGuide.hints.slice(0, hintDepth).map(hint =>
      h('p', {testid: `hint-text-${hint.level}`}, h('strong', {text: `힌트 ${hint.level}단계: `}), hint.text))) : null);
    transferForm.lock(transfer.original !== null);
    transferSlots.retryEntry.replaceChildren(...(transfer.revealed ? [transferRetryForm.node, transferButtons.retry] : []));
    replaceChildren(transferSlots.original, transfer.original ? originalDisplay('transfer-original', transfer.original) : null);
    replaceChildren(transferSlots.calc, transfer.calculationError ? h('div', {role: 'alert', class: 'notice warn', testid: 'transfer-calculation-error'},
      h('p', {text: '⚠ 계산 도구 실패: 새 사례 결과를 계산하지 못했습니다. 이 실패는 이해 부족으로 판정하지 않으며 판정은 보류됩니다.'}), statusLine('pending')) : null);
    if (transfer.revealed) {
      const expected = transferCase.expected;
      const result = calculated(transfer.inputs);
      const grade = gradeTransferPrediction(transfer.original.values, expected);
      const context = `새 사례(${describeInputs(transfer.inputs)}), 결과 공개 전 최초 예측, 도움 ${HELP_LABELS[transfer.original.help]}`;
      replaceChildren(transferSlots.result, h('div', {class: 'result', testid: 'transfer-result'},
        h('h3', {text: '새 사례 결과'}),
        statusLine(grade.status),
        comparisonTable('transfer-result-table', `새 사례 계산 결과와 최초 예측(${describeInputs(transfer.inputs)})`, transfer.original.values, result),
        feedback(context, grade),
        h('p', {class: 'hint-line', text: OBSERVATION_NOTICE}),
        h('p', {class: 'hint-line', text: NUMBER_NOTES[0]})));
    } else replaceChildren(transferSlots.result, null);
    replaceChildren(transferSlots.retries, retriesList(transfer.retries, '새 사례'));
  };

  const responseNodes = Object.fromEntries(FREE_KINDS.map(kind => {
    const labels = {question: '질문 만들기: 선택을 바꿀 정보를 agent에게 어떻게 물을까요? 그 질문이 선택에 필요한 이유도 적어 보세요.', choice: '선택 이유: 검사 A, B 또는 보류 중 무엇을 잠정 선택하나요? 유리한 조건과 실패 조건을 함께 적어 보세요.', apply: '‘내 상황에 적용’: 내 작업에 비슷한 선택이 있나요? 모르는 조건은 채우지 말고 질문으로 남겨 두세요.'};
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
    replaceChildren(slot('export-error'), state.exportError ? h('p', {class: 'error', role: 'alert', testid: 'export-error', text: `⚠ ${EXPORT_BLOCKED_NOTICE} ${state.exportError}`}) : null);
    const kind = state.saveFailed || state.loadNotice === 'unavailable' ? 'unavailable' : state.loadNotice;
    replaceChildren(slot('storage'), kind ? h('p', {class: 'notice warn', role: 'status', testid: 'storage-notice', 'data-kind': kind, text: `⚠ ${STORAGE_NOTICES[kind]}`}) : null);
    replaceChildren(slot('reset'), state.confirmReset ? h('div', {class: 'notice', role: 'alertdialog', 'aria-label': '학습 초기화 확인'},
      h('p', {text: '저장된 입력·예측·응답·힌트 기록을 모두 지우고 처음 상태로 돌아갑니다. 이미 내려받은 파일은 지워지지 않습니다.'}),
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
    const fresh = loadProgress({getItem: () => null}, session).progress;
    Object.assign(state, {progress: fresh, errors: {}, confirmReset: false, exportError: null, highlight: null, loadNotice: state.loadNotice === 'unavailable' ? 'unavailable' : null});
    for (const form of [baselineForm, transferForm, baselineRetryForm, transferRetryForm]) form.write(null);
    baselineForm.showError('prediction-error', null, []);
    transferForm.showError('transfer-error', null, []);
    renderAll();
    resetButton.focus();
  }

  const exportResult = async () => {
    state.exportError = null;
    let document_;
    try {
      document_ = await finalizeResult(buildResult(state.progress, inspectionLesson, session, new Date()));
    } catch (error) {
      state.exportError = String(error.message);
    }
    if (document_) {
      const shape = validateResultShape(document_);
      if (!shape.ok) state.exportError = shape.errors.map(error => `${error.code} ${error.path || '/'}`).join(', ');
      else {
        const url = URL.createObjectURL(new Blob([JSON.stringify(document_, null, 2)], {type: 'application/json'}));
        const link = h('a', {href: url, download: `result-${session.resultId}.json`});
        window.document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
    renderFinish();
  };

  const explanationParagraph = h('p', {id: 'explanation-denominators', tabindex: '-1', testid: 'explanation-denominators'},
    '분모를 구분하세요. 결함 비율은 전체 제품, 검출률은 실제 결함 제품, 오탐률은 정상 제품, PPV는 양성 제품 전체, 전체 정확도는 전체 제품이 분모입니다. 고정 표본 N=10,000, p=결함 비율÷100, s=검출률÷100, f=오탐률÷100일 때 TP=N·p·s, FP=N·(1−p)·f, FN=N·p·(1−s), TN=N·(1−p)·(1−f)이고 PPV=TP÷(TP+FP), 전체 정확도=(TP+TN)÷N입니다. 이는 기대값 계산이며 실제 표본이나 신뢰구간 추정이 아닙니다(계산 정의 근거: MedCalc 공식 문서의 예측값 설명).');
  const toExplanation = h('a', {href: '#explanation-denominators', id: 'link-to-explanation', testid: 'link-to-explanation', text: '이 결과의 원리 설명으로 이동 →'});
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
    const explanation = state.highlight === 'explanation';
    if (explanation) explanationParagraph.setAttribute('data-highlighted', 'true');
    else explanationParagraph.removeAttribute('data-highlighted');
    for (const field of INPUT_FIELDS) {
      if (state.highlight) inputNodes[field].setAttribute('data-highlighted', 'true');
      else inputNodes[field].removeAttribute('data-highlighted');
    }
  }

  const compareA = calculated(scenarioInputs('baseline-a'));
  const compareB = calculated(scenarioInputs('candidate-b'));
  const side = (testid, title, claim, evidence, condition, ask) => h('section', {class: 'choice-card', testid, 'aria-label': title},
    h('h4', {text: title}),
    h('dl', {}, h('dt', {text: '주장'}), h('dd', {text: claim}), h('dt', {text: '계산 근거'}), h('dd', {text: evidence}),
      h('dt', {text: '이 근거가 우세한 조건'}), h('dd', {text: condition}), h('dt', {text: '먼저 확인할 정보'}), h('dd', {text: ask})));
  const choicePair = h('div', {class: 'choice-pair'},
    side('choice-pro', '＋ 찬성: B를 선택하는 근거', '후보 B는 정상 제품을 양성으로 잘못 보내는 일을 줄입니다.',
      `FP ${formatCount(compareA.falsePositive)} → ${formatCount(compareB.falsePositive)}, PPV ${formatRatio(compareA.positivePredictiveValue)} → ${formatRatio(compareB.positivePredictiveValue)}`,
      '정상 제품을 멈추거나 폐기하는 비용, 추가 확인 처리 부담이 큰 경우', '정상 제품 정지·폐기 비용, 추가 확인 처리 용량'),
    side('choice-con', '－ 반대: B를 선택하지 않는 근거', '후보 B는 실제 결함을 더 놓칩니다.',
      `FN ${formatCount(compareA.falseNegative)} → ${formatCount(compareB.falseNegative)}, TP ${formatCount(compareA.truePositive)} → ${formatCount(compareB.truePositive)}`,
      '놓친 결함의 비용이나 안전 영향이 큰 경우', '놓친 결함 한 개의 비용, 안전 조건, 확인 검사의 성능과 독립성'));

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
    h('p', {text: `기본 A(${describeInputs(baselineInputs)}, 제품 10,000개)에서 아래 7개 값을 예상해 보세요. 최초 예측은 기록하면 바꿀 수 없고, 건너뛰어도 됩니다. 비율은 % 단위입니다.`}),
    baselineForm.node, h('div', {class: 'buttons'}, baselineButtons.record, baselineButtons.skip, baselineExtra),
    baselineSlots.original, baselineSlots.comparison, baselineSlots.retries);
  const simulationBlock = section('sec-simulation', '입력을 바꿔 보기', h('p', {text: '한 번에 한 비율만 바꾸면 어떤 변화가 어떤 출력에 연결되는지 볼 수 있습니다. 세 입력 모두 단위는 %입니다.'}),
    h('div', {class: 'buttons', role: 'group', 'aria-label': '시나리오'}, scenarioButtons.map(item => item.button), h('button', {type: 'button', testid: 'reset-inputs', text: '입력 초기화', onclick: () => {
      state.errors = {};
      dispatch({type: 'resetInputs'});
      renderSimulation();
    }})),
    h('p', {class: 'hint-line', text: `초기화 범위: 세 입력만 기본값(${describeInputs(DEFAULT_INPUTS)})으로 되돌립니다. 예측·응답·힌트 기록은 지우지 않습니다.`}),
    inputRows, slot('stale'), outputTable, previousNote, slot('undefined-ppv'), slot('fraction'),
    h('div', {class: 'grid-box'}, h('h4', {text: '10,000칸 시각화'}), grid.root, grid.legend,
      h('p', {class: 'hint-line', text: '색만이 아니라 무늬와 위의 표로도 같은 값을 볼 수 있습니다. 칸 수는 반올림해 그립니다.'})),
    h('p', {}, toExplanation));
  const populationContrast = calculated(scenarioInputs('population-contrast'));
  const explanationBlock = section('sec-explanation', '원리와 대비 예시', explanationParagraph,
    h('p', {text: `대비: 검출률 ${inspectionScenarios[0].inputs.detectionPercent}%, 오탐률 ${inspectionScenarios[0].inputs.falsePositivePercent}%를 유지하고 결함 비율만 ${scenarioInputs('baseline-a').defectPercent}%에서 ${scenarioInputs('population-contrast').defectPercent}%로 바꾸면 PPV가 ${formatRatio(compareA.positivePredictiveValue)}에서 ${formatRatio(populationContrast.positivePredictiveValue)}로 달라집니다. 집단이 다르면 이전 PPV를 그대로 가져올 수 없습니다.`}),
    h('p', {text: '실패 조건과 한계: 전체 정확도를 “양성이 실제 결함일 확률”로 읽으면 어긋납니다. 이 계산은 집단이 바뀌어도 검출률과 오탐률이 유지된다고 가정하며, 실제 제품·라인·검사 환경에서 맞는지는 따로 확인해야 합니다.'}),
    h('p', {}, backLink));
  const choiceBlock = section('sec-choice', '검사 A와 B 비교', h('p', {text: `A(${describeInputs(scenarioInputs('baseline-a'))})에서 B(${describeInputs(scenarioInputs('candidate-b'))})로 바꾸면 검출률과 오탐률 두 입력이 함께 달라집니다. 이 화면은 A나 B를 정답으로 제시하지 않으며, 같은 형식으로 두 쪽의 근거를 나란히 보입니다. 비용이 정해지지 않았다면 보류도 선택지입니다.`}), choicePair);
  const transferBlock = h('div', {testid: 'transfer-prediction'},
    h('p', {text: `새 사례: ${describeInputs(transferCase.inputs)}, 제품 10,000개. 위의 설명과 이전 결과를 가린 채 7개 값을 예상하세요. 기록하거나 건너뛰면 결과가 나타납니다.`}),
    h('div', {class: 'help-box'}, h('p', {text: '막히면 필요한 만큼만 힌트를 펼치세요. 도움은 벌점이 아니며 기록됩니다. 힌트를 본 사실만으로 수행이 인정되지는 않습니다.'}),
      h('div', {class: 'buttons', role: 'group', 'aria-label': '힌트 단계'}, hintButtons), transferSlots.hints,
      h('div', {class: 'field-row'}, h('label', {for: 'help-level', text: '도움 수준(결과에 기록됨)'}), helpSelect)),
    transferForm.node, h('div', {class: 'buttons'}, transferButtons.record, transferButtons.skip), transferSlots.retryEntry,
    transferSlots.original, transferSlots.calc, transferSlots.result, transferSlots.retries);
  const responsesBlock = section('sec-responses', '내 질문·선택·적용', h('p', {text: '정해진 문장과 맞는지가 아니라, 어떤 정보가 선택을 바꾸는지와 그 이유를 봅니다. 자유 응답은 agent가 나중에 검토하며 이 화면은 채점하지 않습니다.'}), FREE_KINDS.map(kind => responseNodes[kind].node));

  const STAGE_TITLES = {context: '맥락', prediction: '기본 A 예측', simulation: '조작과 비교', assessment: '새 사례 확인', return: '작업으로 돌아가기', map: '정리와 다음 학습'};
  const STAGE_BODIES = {
    context: () => [
      h('p', {text: '공장에서 제품 10,000개를 검사합니다. 먼저 스스로 예상해 보세요. “검사 정확도가 높으면 양성 제품 대부분이 결함일까?”, “결함이 더 흔한 생산 라인에서도 양성의 의미가 같을까?” 이 예상은 지식 차이의 가설이며, 한 번의 오답이나 자신감으로 사람을 판정하지 않습니다.'}),
      h('p', {text: '이번 수업에서는 검사 A와 B를 비교하고 양성 제품의 자동 조치·추가 확인·보류를 생각해 봅니다. 현실에서 고르는 것은 검사 종류와 후속 조치이며, 집단의 결함 비율은 마음대로 고를 수 없습니다. 약 15–20분을 설계 예산으로 둔 수업이며 개인별 시간이나 효과를 보장하지 않습니다.'}),
    ],
    prediction: () => [conceptSection, baselineBlock],
    simulation: () => [conceptSection, baselineBlock, simulationBlock, explanationBlock, choiceBlock],
    assessment: () => [conceptSection, transferBlock, responsesBlock],
    return: () => [h('p', {text: '실제 작업으로 돌아갈 요약을 세 문장으로 생각해 보세요. “나는 검사 또는 후속 조치를 이렇게 잠정 선택한다/보류한다.” “이 선택은 이 비용·성능 조건에서 유리하고 이 조건에서 실패한다.” “agent에게 이 정보를 확인해 달라고 요청하고 확인되면 재검토한다.” 실제 집단의 결함 비율과 검사 환경은 모르면 질문으로 남기세요. 수업 사례를 실제 생산 승인으로 옮기지 마세요.'})],
    map: () => [
      h('p', {text: '이번에 관찰한 수행과 도움 조건, 미확인 항목은 내보낸 결과에 담깁니다. PPV 분모가 어려웠다면 분모와 조건부 비율을, 집단 차이가 어려웠다면 성능 유지 가정을, 선택을 보류했다면 오류 비용과 추가 검사 독립성을 다음 학습 후보로 삼을 수 있습니다. 미검토(pending)와 건너뜀(skipped)은 완료나 숙련으로 바뀌지 않습니다.'}),
      lessonState, h('div', {class: 'buttons'}, completeButton),
    ],
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
    state.stageError = result.ok ? null : '기본 A 예측을 기록하거나 건너뛰어야 다음 단계로 갈 수 있습니다.';
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
    h('h1', {text: '검사 정확도와 양성 결과의 의미'}),
    h('p', {class: 'notice', role: 'note', testid: 'safety-notice', text: SAFETY_NOTICE}),
    stageIndicator, stageHost, h('div', {class: 'buttons'}, navButtons), slot('stage-error'),
    h('section', {'aria-labelledby': 'finish-title'}, h('h2', {id: 'finish-title', text: '결과 내보내기와 저장'}),
      h('div', {class: 'buttons'}, h('button', {type: 'button', testid: 'export-result', onclick: exportResult, text: '결과 파일 내려받기'}), resetButton),
      h('p', {class: 'notice', role: 'note', testid: 'export-notice', text: EXPORT_NOTICE}), slot('export-error'), slot('storage'), slot('reset')));

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
