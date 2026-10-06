const REACTIONS = [['similar', '내 문제와 비슷함'], ['surprising', '의외임'], ['unknown', '모르겠음'], ['not-applicable', '해당 없음']];
const NOTICE = '아래 반응은 지식이나 능력을 판정하지 않습니다. 어떤 주제를 먼저 다룰지 정하는 가설의 재료로만 쓰이며, 이 화면은 진행을 저장하지 않습니다. 내려받은 파일을 agent에게 전달해야 반영됩니다.';

function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'testid') element.setAttribute('data-testid', value);
    else if (key === 'text') element.textContent = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value === true ? '' : value);
  }
  element.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
  return element;
}

export function mountDiagnostic(setup) {
  document.documentElement.lang = 'ko';
  // The Framework template pins maximum-scale=1, which blocks user zoom.
  document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1');
  const answers = setup.rounds.map(() => ({}));
  let current = 0;
  let exported = false;

  const host = h('div', {});
  const heading = h('h2', {id: 'round-title', tabindex: '-1'});
  const cards = h('div', {});
  const status = h('p', {class: 'hint-line', role: 'status'});
  const action = h('span', {});

  const complete = () => setup.rounds[current].candidates.every(candidate => answers[current][candidate.candidateId]);

  function download() {
    const document_ = {
      kind: 'diagnostic-choices', version: 1, diagnosticId: setup.diagnosticId, profileId: setup.profileId, contextKind: setup.contextKind,
      rounds: setup.rounds.map((round, index) => ({candidates: round.candidates, reactions: round.candidates.map(candidate => ({candidateId: candidate.candidateId, reaction: answers[index][candidate.candidateId]}))})),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(document_, null, 2)], {type: 'application/json'}));
    const link = h('a', {href: url, download: `diagnostic-choices-${setup.diagnosticId}.json`});
    window.document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    exported = true;
    status.textContent = '파일을 내려받았습니다. 파일 경로를 agent에게 전달하세요. 이 화면은 반응을 저장하지 않습니다.';
  }

  function refresh() {
    const last = current === setup.rounds.length - 1;
    const button = last
      ? h('button', {type: 'button', testid: 'diagnostic-export', text: '선택 파일 내려받기', onclick: download})
      : h('button', {type: 'button', testid: 'diagnostic-next', text: '다음 라운드 →', onclick: () => {
        current += 1;
        render();
        heading.focus();
      }});
    button.disabled = !complete();
    action.replaceChildren(button);
    if (!exported) status.textContent = button.disabled ? '모든 카드에 반응을 고르면 계속할 수 있습니다.' : '모든 카드에 반응했습니다.';
  }

  function render() {
    const round = setup.rounds[current];
    heading.textContent = `라운드 ${current + 1}/${setup.rounds.length}`;
    cards.replaceChildren(...round.candidates.map(candidate => h('fieldset', {class: 'card', testid: `candidate-${candidate.candidateId}`},
      h('legend', {text: candidate.title}),
      h('dl', {}, h('dt', {text: '결정할 질문'}), h('dd', {text: candidate.decisionQuestion}), h('dt', {text: '이 카드가 나온 이유'}), h('dd', {text: candidate.reason}), h('dt', {text: '미리보기'}), h('dd', {text: candidate.preview})),
      h('div', {class: 'reactions', role: 'radiogroup', 'aria-label': `${candidate.title}에 대한 반응`}, REACTIONS.map(([reaction, label]) => {
        const id = `reaction-${candidate.candidateId}-${reaction}`;
        const radio = h('input', {type: 'radio', id, name: `reaction-${candidate.candidateId}`, value: reaction, testid: id});
        radio.checked = answers[current][candidate.candidateId] === reaction;
        radio.addEventListener('change', () => {
          answers[current][candidate.candidateId] = reaction;
          refresh();
        });
        return h('label', {for: id}, radio, label);
      })))));
    refresh();
  }

  document.getElementById('app').replaceChildren(
    h('h1', {text: 'Learn to Tell 진단'}),
    h('p', {class: 'notice', role: 'note', testid: 'diagnostic-notice', text: NOTICE}),
    host);
  host.append(heading, cards, action, status);
  render();
}
