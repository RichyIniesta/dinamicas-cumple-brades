const views = [...document.querySelectorAll('[data-screen]')];
const viewLabel = document.querySelector('#view-label');
const toast = document.querySelector('#toast');
const labels = {
  home: 'Dinámicas de cumpleaños',
  presentation: 'Inicio de presentación',
  roulette: 'Ruleta de poderes',
  timer: 'Temporizador'
};

function showView(name) {
  views.forEach(view => {
    const active = view.dataset.screen === name;
    view.classList.toggle('is-active', active);
    view.setAttribute('aria-hidden', String(!active));
  });
  viewLabel.textContent = labels[name] || labels.home;
  window.scrollTo({top: 0, behavior: 'smooth'});
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-view]');
  if (target) showView(target.dataset.view);
});

document.querySelector('#year').textContent = new Date().getFullYear();

// Presentación
const slides = [...document.querySelectorAll('.slide')];
let currentSlide = 0;
const slideCurrent = document.querySelector('#slide-current');
const slideTotal = document.querySelector('#slide-total');
slideTotal.textContent = String(slides.length).padStart(2,'0');

function renderSlide() {
  slides.forEach((slide, index) => slide.classList.toggle('is-visible', index === currentSlide));
  slideCurrent.textContent = String(currentSlide + 1).padStart(2,'0');
  document.querySelector('#slide-prev').disabled = currentSlide === 0;
  document.querySelector('#slide-next').innerHTML = currentSlide === slides.length - 1 ? 'Reiniciar <span>↻</span>' : 'Siguiente <span>→</span>';
}
document.querySelector('#slide-prev').addEventListener('click', () => {
  if (currentSlide > 0) { currentSlide--; renderSlide(); }
});
document.querySelector('#slide-next').addEventListener('click', () => {
  currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
  renderSlide();
});
document.querySelector('#slide-fullscreen').addEventListener('click', async () => {
  const stage = document.querySelector('.presentation-stage');
  if (!document.fullscreenElement) await stage.requestFullscreen?.();
  else await document.exitFullscreen?.();
});
renderSlide();

// Ruleta
const powers = ['Súper voz','Súper baile','Súper memoria','Súper actuación','Súper velocidad','Súper talento'];
const wheel = document.querySelector('#wheel');
const spinButton = document.querySelector('#spin-button');
const result = document.querySelector('#roulette-result');
const resultMessage = document.querySelector('#roulette-message');
let rotation = 0;
let spinning = false;

spinButton.addEventListener('click', () => {
  if (spinning) return;
  spinning = true;
  spinButton.disabled = true;
  result.textContent = '...';
  resultMessage.textContent = 'La ruleta está eligiendo un poder.';
  const index = Math.floor(Math.random() * powers.length);
  const segment = 360 / powers.length;
  const target = 360 - (index * segment + segment / 2);
  const normalized = ((rotation % 360) + 360) % 360;
  const delta = 360 * 6 + ((target - normalized + 360) % 360);
  rotation += delta;
  wheel.style.transform = `rotate(${rotation}deg)`;
  setTimeout(() => {
    result.textContent = powers[index];
    resultMessage.textContent = '¡Es momento de usar ese poder!';
    spinButton.disabled = false;
    spinning = false;
  }, 4300);
});

// Temporizador
const display = document.querySelector('#timer-display');
const minInput = document.querySelector('#timer-minutes');
const secInput = document.querySelector('#timer-seconds');
const toggle = document.querySelector('#timer-toggle');
const reset = document.querySelector('#timer-reset');
const timerView = document.querySelector('.timer-view');
let timerSeconds = 60;
let timerInterval = null;
let running = false;

function readInputs() {
  const minutes = Math.max(0, Math.min(99, Number(minInput.value) || 0));
  const seconds = Math.max(0, Math.min(59, Number(secInput.value) || 0));
  return minutes * 60 + seconds;
}
function formatTime(total) {
  const minutes = Math.floor(total / 60).toString().padStart(2,'0');
  const seconds = (total % 60).toString().padStart(2,'0');
  return `${minutes}:${seconds}`;
}
function renderTimer() {
  display.textContent = formatTime(timerSeconds);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  running = false;
  toggle.innerHTML = 'Iniciar <span>→</span>';
}
toggle.addEventListener('click', () => {
  if (running) {
    stopTimer();
    toggle.innerHTML = 'Continuar <span>→</span>';
    return;
  }
  if (timerSeconds <= 0) timerSeconds = readInputs();
  if (timerSeconds <= 0) return;
  timerView.classList.remove('timer-done');
  running = true;
  toggle.innerHTML = 'Pausar <span>Ⅱ</span>';
  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      stopTimer();
      timerView.classList.add('timer-done');
      toggle.innerHTML = 'Iniciar <span>→</span>';
      showToast('¡Tiempo!');
    }
  }, 1000);
});
reset.addEventListener('click', () => {
  stopTimer();
  timerSeconds = readInputs();
  timerView.classList.remove('timer-done');
  renderTimer();
});
[minInput, secInput].forEach(input => input.addEventListener('change', () => {
  if (!running) {
    timerSeconds = readInputs();
    timerView.classList.remove('timer-done');
    renderTimer();
  }
}));
renderTimer();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') showView('home');
  if (document.querySelector('[data-screen="presentation"]').classList.contains('is-active')) {
    if (event.key === 'ArrowRight') document.querySelector('#slide-next').click();
    if (event.key === 'ArrowLeft') document.querySelector('#slide-prev').click();
  }
});