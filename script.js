// Elementos base compartidos por varias interacciones.
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const toast = document.querySelector('#toast');

const days = ['Lunes', 'Martes', 'Mi&eacute;rcoles', 'Jueves', 'Viernes'];
const dayValues = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const times = ['17:00', '18:00', '19:00', '20:00'];
let selectedDay = dayValues[0];
let pendingSlot = null;
let selectedStars = 5;
let toastTimer = null;

const defaultReviews = [
    { name: 'María G.', level: 'Selectividad', text: 'Álvaro me ayudó a sacar un 9 en EvAU. Explica genial y tiene mucha paciencia.', stars: 5, date: '2026-04-29' },
    { name: 'Carlos R.', level: '2º Bachillerato', text: 'Por fin entiendo integrales. Las clases son muy dinámicas y se nota que domina el tema.', stars: 5, date: '2026-04-29' },
    { name: 'Laura P.', level: '4º ESO', text: 'He subido dos notas en lo que va de curso. Muy recomendable.', stars: 5, date: '2026-04-29' }
];

// Cambia la navbar de transparente a solida cuando se avanza en la pagina.
function updateNavbarBackground() {
    header.classList.toggle('scrolled', window.scrollY > 50);
}

updateNavbarBackground();
window.addEventListener('scroll', updateNavbarBackground);

// Gestiona el menu hamburguesa responsive.
navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('open');
    navMenu.classList.toggle('open', isOpen);
    header.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menu' : 'Abrir menu');
});

navMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));

function closeMobileMenu() {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    header.classList.remove('open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
}

// Anima cada bloque reveal cuando entra en el viewport.
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Lee y guarda arrays en localStorage con tolerancia a datos corruptos.
function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function saveStoredArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Renderiza las tabs y slots de reserva.
const tabsContainer = document.querySelector('.day-tabs');
const slotGrid = document.querySelector('.slot-grid');

function renderDayTabs() {
    tabsContainer.innerHTML = dayValues.map((day, index) => `
        <button class="day-tab ${day === selectedDay ? 'active' : ''}" type="button" data-day="${day}" role="tab" aria-selected="${day === selectedDay}">
            ${days[index]}
        </button>
    `).join('');
}

function renderSlots() {
    const reservations = readStoredArray('math-reservations');
    slotGrid.innerHTML = times.map((time) => {
        const occupied = reservations.some((reservation) => reservation.day === selectedDay && reservation.time === time);
        return `<button class="slot" type="button" data-time="${time}" ${occupied ? 'disabled' : ''}>${time}<span>${occupied ? 'Ocupado' : 'Libre'}</span></button>`;
    }).join('');
}

function renderBooking() {
    renderDayTabs();
    renderSlots();
}

tabsContainer.addEventListener('click', (event) => {
    const tab = event.target.closest('.day-tab');
    if (!tab) return;
    selectedDay = tab.dataset.day;
    renderBooking();
});

slotGrid.addEventListener('click', (event) => {
    const slot = event.target.closest('.slot');
    if (!slot || slot.disabled) return;
    pendingSlot = { day: selectedDay, time: slot.dataset.time };
    openBookingModal();
});

renderBooking();

// Modal de reserva y guardado en localStorage.
const modal = document.querySelector('#booking-modal');
const modalSlot = document.querySelector('#modal-slot');
const bookingForm = document.querySelector('#booking-form');

function openBookingModal() {
    const dayLabel = days[dayValues.indexOf(pendingSlot.day)];
    modalSlot.innerHTML = `${dayLabel}, ${pendingSlot.time}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    bookingForm.querySelector('input[name="name"]').focus();
}

function closeBookingModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    bookingForm.reset();
}

modal.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeBookingModal));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeBookingModal();
});

bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    const reservations = readStoredArray('math-reservations');

    reservations.push({
        day: pendingSlot.day,
        time: pendingSlot.time,
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        level: formData.get('level'),
        notes: formData.get('notes').trim(),
        date: new Date().toISOString()
    });

    saveStoredArray('math-reservations', reservations);
    closeBookingModal();
    renderSlots();
    showToast('Reserva registrada. Te contactare por email para confirmarla.');
});

// Opiniones: carga inicial, estrellas clicables y guardado local.
const reviewList = document.querySelector('#review-list');
const reviewForm = document.querySelector('#review-form');
const starButtons = document.querySelectorAll('.star-picker button');
const starsInput = reviewForm.querySelector('input[name="stars"]');

function getReviews() {
    const storedReviews = readStoredArray('math-reviews');
    return storedReviews.length ? storedReviews : defaultReviews;
}

function renderStars(count) {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
}

function renderReviews() {
    reviewList.innerHTML = '';

    getReviews().forEach((review) => {
        const card = document.createElement('article');
        const stars = document.createElement('div');
        const text = document.createElement('p');
        const meta = document.createElement('div');

        card.className = 'review-card reveal visible';
        stars.className = 'stars';
        stars.setAttribute('aria-label', `${review.stars} de 5 estrellas`);
        stars.textContent = renderStars(Number(review.stars));
        text.textContent = review.text;
        meta.className = 'review-meta';
        meta.textContent = `${review.name} — ${review.level}`;

        card.append(stars, text, meta);
        reviewList.append(card);
    });
}

function updateStarPicker(value) {
    selectedStars = Number(value);
    starsInput.value = String(selectedStars);
    starButtons.forEach((button) => button.classList.toggle('active', Number(button.dataset.stars) <= selectedStars));
}

starButtons.forEach((button) => button.addEventListener('click', () => updateStarPicker(button.dataset.stars)));

reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(reviewForm);
    const existing = readStoredArray('math-reviews');
    const reviews = existing.length ? existing : defaultReviews.slice();

    reviews.push({
        name: formData.get('name').trim(),
        level: formData.get('level'),
        text: formData.get('text').trim(),
        stars: Number(formData.get('stars')),
        date: new Date().toISOString()
    });

    saveStoredArray('math-reviews', reviews);
    reviewForm.reset();
    updateStarPicker(5);
    renderReviews();
    showToast('Opinion publicada correctamente.');
});

updateStarPicker(5);
renderReviews();

// FAQ con max-height animado para que la transicion sea suave.
document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
        const isActive = item.classList.toggle('active');
        answer.style.maxHeight = isActive ? `${answer.scrollHeight}px` : '0px';
    });
});

// Formulario de contacto simulado.
document.querySelector('#contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast('Mensaje enviado. Te respondere lo antes posible.');
});
