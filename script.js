const views = [...document.querySelectorAll('[data-screen]')];
const toast = document.querySelector('#toast');
const navItems = [...document.querySelectorAll('[data-nav]')];

function showView(name) {
  views.forEach(view => {
    const active = view.dataset.screen === name;
    view.classList.toggle('is-active', active);
    view.setAttribute('aria-hidden', String(!active));
  });
  navItems.forEach(item => {
    const active = item.dataset.nav === name;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-current', active ? 'page' : 'false');
  });
  window.scrollTo({top: 0, behavior: 'smooth'});
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-view]');
  if (target) showView(target.dataset.view);
});

// Presentación desde GitHub
const presentationStage = document.querySelector('#presentation-stage');
const presentationLoading = document.querySelector('#presentation-loading');
const presentationEmpty = document.querySelector('#presentation-empty');
const presentationImageWrap = document.querySelector('#presentation-image-wrap');
const presentationImage = document.querySelector('#presentation-image');
const presentationPrev = document.querySelector('#slide-prev');
const presentationNext = document.querySelector('#slide-next');
const presentationFullscreen = document.querySelector('#slide-fullscreen');
const PRESENTATION_FOLDER_API = 'https://api.github.com/repos/RichyIniesta/dinamicas-cumple-brades/contents/img/presentacion?ref=main';
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif)$/i;
let presentationImages = [];
let currentSlide = 0;

async function loadPresentationImages() {
  presentationLoading.hidden = false;
  presentationEmpty.hidden = true;
  presentationImageWrap.hidden = true;
  try {
    const response = await fetch(PRESENTATION_FOLDER_API, {cache: 'no-store'});
    if (!response.ok) throw new Error('No se pudo consultar la carpeta de presentación.');
    const files = await response.json();
    presentationImages = Array.isArray(files)
      ? files
          .filter(file => file.type === 'file' && IMAGE_EXTENSIONS.test(file.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}))
      : [];
    currentSlide = 0;
    presentationLoading.hidden = true;
    if (!presentationImages.length) {
      presentationEmpty.hidden = false;
      updatePresentationControls();
      return;
    }
    presentationImageWrap.hidden = false;
    renderPresentationImage();
  } catch (error) {
    presentationLoading.hidden = true;
    presentationEmpty.hidden = false;
    presentationEmpty.querySelector('strong').textContent = 'No se pudo cargar la presentación.';
    presentationEmpty.querySelector('span').textContent = 'Verifica que las imágenes estén en img/presentacion/ y que el repositorio sea accesible.';
    updatePresentationControls();
    console.error(error);
  }
}

function renderPresentationImage() {
  if (!presentationImages.length) return;
  const file = presentationImages[currentSlide];
  presentationImage.src = file.download_url;
  presentationImage.alt = `Diapositiva ${currentSlide + 1} de ${presentationImages.length}: ${file.name}`;
  presentationImageWrap.classList.remove('is-changing');
  requestAnimationFrame(() => presentationImageWrap.classList.add('is-changing'));
  updatePresentationControls();
}

function updatePresentationControls() {
  const hasImages = presentationImages.length > 0;
  presentationPrev.disabled = !hasImages || currentSlide === 0;
  presentationNext.disabled = !hasImages;
  presentationNext.innerHTML = hasImages && currentSlide === presentationImages.length - 1
    ? 'Reiniciar <span>↻</span>'
    : 'Siguiente <span>→</span>';
}

function nextPresentationImage() {
  if (!presentationImages.length) return;
  currentSlide = currentSlide === presentationImages.length - 1 ? 0 : currentSlide + 1;
  renderPresentationImage();
}

presentationPrev.addEventListener('click', () => {
  if (currentSlide > 0) {
    currentSlide--;
    renderPresentationImage();
  }
});

presentationNext.addEventListener('click', nextPresentationImage);

presentationFullscreen.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await presentationStage.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  } catch {
    showToast('La pantalla completa no está disponible.');
  }
});

loadPresentationImages();

// Ruleta dinámica
const wheel = document.querySelector('#wheel');
const spinButton = document.querySelector('#spin-button');
const result = document.querySelector('#roulette-result');
const resultMessage = document.querySelector('#roulette-message');
const announcement = document.querySelector('#roulette-announcement');
const announcementText = document.querySelector('#roulette-announcement-text');
let announcementTimer = null;
const powerInput = document.querySelector('#power-input');
const addPowerButton = document.querySelector('#add-power');
const powerList = document.querySelector('#power-list');
let powers = [];
try {
  const savedPowers = JSON.parse(localStorage.getItem('bradesco-birthday-powers') || '[]');
  powers = Array.isArray(savedPowers)
    ? savedPowers.filter(power => typeof power === 'string' && power.trim())
    : [];
} catch {
  powers = [];
}
let rotation = 0;
let spinning = false;

function savePowers() {
  localStorage.setItem('bradesco-birthday-powers', JSON.stringify(powers));
}

function renderPowerList() {
  powerList.innerHTML = '';
  powers.forEach((power, index) => {
    const chip = document.createElement('span');
    chip.className = 'power-chip';

    const label = document.createElement('span');
    label.textContent = power;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.dataset.removePower = String(index);
    removeButton.setAttribute('aria-label', `Eliminar ${power}`);
    removeButton.textContent = '×';

    chip.append(label, removeButton);
    powerList.appendChild(chip);
  });
}

function renderWheel() {
  wheel.querySelectorAll('.wheel-label,.wheel-empty').forEach(el => el.remove());
  const count = powers.length;
  if (!count) {
    wheel.style.background = '#171717';
    const empty = document.createElement('div');
    empty.className = 'wheel-empty';
    empty.textContent = 'Agrega poderes para comenzar';
    wheel.appendChild(empty);
    spinButton.disabled = true;
    return;
  }

  const segment = 360 / count;
  const stops = [];
  for (let i = 0; i < count; i++) {
    const color = i % 2 === 0 ? '#cc092f' : '#171717';
    stops.push(`#fff ${i * segment}deg ${i * segment + 1.2}deg`);
    stops.push(`${color} ${i * segment + 1.2}deg ${(i + 1) * segment - 1.2}deg`);
    stops.push(`#fff ${(i + 1) * segment - 1.2}deg ${(i + 1) * segment}deg`);
  }
  wheel.style.background = `conic-gradient(${stops.join(',')})`;
  spinButton.disabled = spinning;

  powers.forEach((power, index) => {
    const label = document.createElement('span');
    label.className = 'wheel-label';
    label.textContent = power;
    label.style.transform = `translate(-50%, -50%) rotate(${index * segment + segment / 2}deg) translateY(-112px)`;
    wheel.appendChild(label);
  });
}

function addPower() {
  const power = powerInput.value.trim();
  if (!power) return;
  if (powers.some(item => item.toLocaleLowerCase() === power.toLocaleLowerCase())) {
    showToast('Ese poder ya está en la ruleta.');
    powerInput.focus();
    return;
  }
  powers.push(power);
  savePowers();
  renderPowerList();
  renderWheel();
  powerInput.value = '';
  powerInput.focus();
  result.textContent = '—';
  resultMessage.textContent = `${powers.length} poder${powers.length === 1 ? '' : 'es'} disponible${powers.length === 1 ? '' : 's'}.`;
}

addPowerButton.addEventListener('click', addPower);
powerInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') addPower();
});

powerList.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-power]');
  if (!button || spinning) return;
  powers.splice(Number(button.dataset.removePower), 1);
  savePowers();
  renderPowerList();
  renderWheel();
});

spinButton.addEventListener('click', () => {
  if (spinning || !powers.length) return;
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
    const selectedPower = powers[index];
    result.textContent = selectedPower;
    powers.splice(index, 1);
    savePowers();
    renderPowerList();
    renderWheel();
    spinning = false;
    spinButton.disabled = powers.length === 0;
    resultMessage.textContent = powers.length
      ? '¡Poder elegido! Ya puedes girar de nuevo.'
      : 'No quedan poderes. Agrega nuevos para continuar.';
    showRouletteAnnouncement(selectedPower);
  }, 4300);
});

renderPowerList();
renderWheel();

function showRouletteAnnouncement(power) {
  clearTimeout(announcementTimer);
  announcementText.textContent = power;
  announcement.classList.add('is-visible');
  announcement.setAttribute('aria-hidden', 'false');
  announcementTimer = setTimeout(() => {
    announcement.classList.remove('is-visible');
    announcement.setAttribute('aria-hidden', 'true');
  }, 3000);
}

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
  const time = formatTime(timerSeconds);
  const [minutes, seconds] = time.split(':');
  display.innerHTML = `
    <div class="flip-group" aria-label="Minutos">
      <span class="flip-digit">${minutes[0]}</span>
      <span class="flip-digit">${minutes[1]}</span>
    </div>
    <span class="flip-separator">:</span>
    <div class="flip-group" aria-label="Segundos">
      <span class="flip-digit">${seconds[0]}</span>
      <span class="flip-digit">${seconds[1]}</span>
    </div>
  `;
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