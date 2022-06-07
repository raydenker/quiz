'use strict';
const main = document.querySelector('.main');

const selection = document.querySelector('.selection');
const mainTitle = document.querySelector('.main__title');
function getData() {
  return fetch('db/quiz_db.json').then((response) => response.json());
}
const shuffle = (Array) => {
  const newArray = [...Array];
  for (let i = newArray.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
function saveResult(result, id) {
  localStorage.setItem(id, result);
}
function loadResult(id) {
  return localStorage.getItem(id);
}

function renderTheme(themes) {
  const list = document.querySelector('.selection__list');
  list.textContent = '';
  const buttons = themes.map((item, idx) => {
    const li = document.createElement('li');
    li.classList.add('selection__item');
    const button = document.createElement('button');
    button.classList.add('selection__btn');
    button.dataset.id = item.id;
    button.textContent = item.theme;
    li.append(button);

    const result = loadResult(themes[idx].id);
    if (result) {
      const p = document.createElement('p');
      p.classList.add('selection__result');
      p.innerHTML = `
      <span class="selection__result-ratio">
          ${result}/${themes[idx].list.length}
      </span>
      <span class="selection__result-result">
          Последний результат
      </span>
      `;

      li.append(p);
    }

    list.append(li);
    return button;
  });

  return buttons;
}
function showElem(elem) {
  let opacity = 0;
  elem.opacity = opacity;
  elem.style.display = '';
  const animation = () => {
    opacity += 0.05;
    elem.style.opacity = opacity;
    if (opacity < 1) {
      requestAnimationFrame(animation);
    }
  };
  requestAnimationFrame(animation);
}
function hideElement(elem, cb) {
  let opacity = getComputedStyle(elem).getPropertyValue('opacity');
  const animation = () => {
    opacity -= 0.05;
    elem.style.opacity = opacity;
    if (opacity > 0) {
      requestAnimationFrame(animation);
    } else {
      elem.style.display = 'none';
      if (cb) cb();
    }
  };
  requestAnimationFrame(animation);
}

function createKeyAnswers(data) {
  const keys = [];
  for (let i = 0; i < data.answers.length; i++) {
    if (data.type === 'radio') {
      keys.push([data.answers[i], !i]);
    } else {
      keys.push([data.answers[i], i < data.correct]);
    }
  }
  return shuffle(keys);
}
function createAnswer(data) {
  const type = data.type;
  const answers = createKeyAnswers(data);
  // console.log(answers);
  const labels = answers.map((item, idx) => {
    const label = document.createElement('label');
    label.classList = 'answer';

    const input = document.createElement('input');

    input.type = type;
    input.name = 'answer';
    input.classList = `answer__${type}`;
    input.value = idx;

    const text = document.createTextNode(item[0]);
    label.append(input, text);
    return label;
  });
  const keys = answers.map((answer) => answer[1]);
  return {
    labels,
    keys,
  };
}
function showREsult(result, quiz) {
  const block = document.createElement('div');
  block.classList = 'main__box main__box_result';
  const percent = (result / quiz.list.length) * 100;
  let ratio = 0;
  quiz.result.forEach((elem, idx) => {
    console.log(elem[0]);
    if (percent >= elem[0]) {
      ratio = idx;
    }
  });
  console.log(percent);
  console.log(ratio);
  console.log(quiz.result[ratio][1]);

  block.innerHTML = `
      <h2 class="main__subtitle main__subtitle_result">
        Ваш результат
      </h2>
      <p class="result__ratio   result__ratio_${ratio + 1}">
        ${result}/${quiz.list.length}
      </p>
      <p class="result__text">
         ${quiz.result[ratio][1]}
      </p>
`;
  const button = document.createElement('button');
  button.classList = 'main__btn main__count_result';
  button.textContent = 'К списку квизов';

  block.append(button);
  showElem(block);
  main.append(block);
  button.onclick = () => {
    hideElement(block, () => {
      initQuiz();
      showElem(mainTitle);
      showElem(selection);
    });
  };
}

function renderQuiz(quiz) {
  const questionBox = document.createElement('div');
  questionBox.classList = 'main__box main__box_qwestion';

  hideElement(mainTitle);
  hideElement(selection, () => {
    main.append(questionBox);
    showElem(questionBox);
  });

  let result = 0;
  let questionCount = 0;

  function showQwestion() {
    const data = quiz.list[questionCount];
    questionCount++;

    questionBox.textContent = '';
    const form = document.createElement('form');
    form.classList = 'main__form_qwestion';
    form.dataset.count = `${questionCount}/${quiz.list.length}`;

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.classList = 'main__subtitle main__subtitle_qwestion';
    legend.textContent = data.question;

    const answersData = createAnswer(data);
    const button = document.createElement('button');
    button.classList = 'main__btn qwestion_next';
    button.textContent = 'Подтвердить';

    fieldset.append(legend, ...answersData.labels);
    form.append(fieldset, button);
    showElem(form);
    questionBox.append(form);
    // console.log(form.answer);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = false;
      const answer = [...form.answer].map((input) => {
        if (input.checked) ok = true;
        return input.checked ? input.value : false;
      });
      if (ok) {
        if (answer.every((result, i) => !!result === answersData.keys[i])) {
          result++;
        }
        if (questionCount < quiz.list.length) {
          // console.log(answer);
          showQwestion();
        } else {
          saveResult(result, quiz.id);
          hideElement(questionBox, () => {
            showREsult(result, quiz);
          });
        }
      } else {
        console.log('Не выбраны ответы');
        form.classList.add('_error');
        setTimeout(() => {
          form.classList.remove('_error');
        }, 1000);
      }
    });
  }
  showQwestion();
}

function addClick(buttons, data) {
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const quiz = data.find((item) => item.id === btn.dataset.id);
      renderQuiz(quiz);
    });
  });
}

async function initQuiz() {
  const data = await getData();
  renderTheme(data);
  const buttons = renderTheme(data);
  addClick(buttons, data);

}
initQuiz();
