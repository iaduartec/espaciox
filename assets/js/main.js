const navToggle = document.querySelector('.hamburger');
const navMenu = document.querySelector('.mobile-nav');
const body = document.body;

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', navMenu.classList.contains('open'));
  });

  navToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navToggle.click();
  });
}

// -------- API helpers --------
const API_BASE = 'http://localhost:8000/api';
let spaceId = null;
let availabilityCache = {};
let currentMonthDate = new Date();

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Error de servidor');
  }
  return resp.json();
}

function setToken(token) {
  localStorage.setItem('espaciox_token', token);
}

function getToken() {
  return localStorage.getItem('espaciox_token');
}

async function ensureAuthenticated(payload) {
  const token = getToken();
  if (token) return token;

  // Intentar login, si falla, registrar
  try {
    const login = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    setToken(login.token);
    return login.token;
  } catch (e) {
    const register = await apiFetch('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        password_confirmation: payload.password,
      }),
    });
    setToken(register.token);
    return register.token;
  }
}

async function loadSpaces() {
  const data = await apiFetch('/spaces');
  const first = data.data?.[0];
  if (!first) throw new Error('No hay espacios activos');
  spaceId = first.id;
}

async function loadCalendar(month) {
  if (!spaceId) await loadSpaces();
  const calendarEl = document.querySelector('#calendario-disponibilidad');
  if (!calendarEl) return;
  calendarEl.innerHTML = '<p>Cargando calendario...</p>';
  try {
    const data = await apiFetch(`/spaces/${spaceId}/calendar?month=${month}`);
    renderCalendar(calendarEl, data.data || []);
  } catch (e) {
    calendarEl.innerHTML = `<p class="alert error">No se pudo cargar el calendario.</p>`;
  }
}

function renderCalendar(container, days) {
  const headers = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  container.innerHTML = '';
  headers.forEach((h) => {
    const div = document.createElement('div');
    div.className = 'weekday';
    div.textContent = h;
    container.appendChild(div);
  });

  if (days.length) {
    const firstDay = new Date(days[0].date);
    const offset = ((firstDay.getDay() || 7) - 1 + 7) % 7; // lunes=0
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('div');
      empty.className = 'day empty';
      container.appendChild(empty);
    }
  }

  days.forEach((day) => {
    const div = document.createElement('div');
    div.className = 'day';
    div.dataset.date = day.date;
    div.textContent = new Date(day.date).getDate();
    if (day.status === 'booked') div.classList.add('ocupado');
    if (day.status === 'blocked') div.classList.add('bloqueado');
    div.addEventListener('click', () => {
      const form = document.querySelector('#form-reserva');
      if (form && form.fecha) {
        form.fecha.value = day.date;
        populateTimeSlots(day.date);
      }
    });
    container.appendChild(div);
  });
}

async function loadAvailability(date) {
  if (!spaceId || !date) return;
  if (availabilityCache[date]) return availabilityCache[date];
  const data = await apiFetch(`/spaces/${spaceId}/availability?date=${date}`);
  availabilityCache[date] = data.data || [];
  return availabilityCache[date];
}

async function populateTimeSlots(date) {
  const select = document.querySelector('#hora');
  if (!select) return;
  select.innerHTML = '<option value="">Cargando horarios...</option>';
  try {
    const slots = await loadAvailability(date);
    const freeSlots = slots.filter((s) => s.status === 'free');
    if (!freeSlots.length) {
      select.innerHTML = '<option value="">Sin huecos libres</option>';
      return;
    }
    select.innerHTML = '';
    freeSlots.forEach((slot) => {
      const opt = document.createElement('option');
      opt.value = slot.start_time;
      opt.textContent = `${slot.start_time} - ${slot.end_time}`;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = '<option value="">Error cargando horarios</option>';
  }
}

function showAlert(form, message, type = 'error') {
  let alert = form.querySelector('.alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.classList.add('alert');
    form.appendChild(alert);
  }
  alert.textContent = message;
  alert.className = `alert ${type}`;
}

async function handleBooking(event) {
  event.preventDefault();
  const form = event.target;
  const nombre = form.nombre.value.trim();
  const email = form.email.value.trim();
  const telefono = form.telefono.value.trim();
  const password = form.password.value.trim();
  const fecha = form.fecha.value;
  const hora = form.hora.value;
  const duracion = Number(form.duracion.value || 2);
  const tipo = form.tipo.value;
  const asistentes = form.asistentes.value ? Number(form.asistentes.value) : null;
  const comentarios = form.comentarios.value.trim();
  const normas = form.normas.checked;

  if (!nombre || !email || !telefono || !password || !fecha || !hora || !normas) {
    showAlert(form, 'Completa los campos obligatorios y acepta las normas.');
    return;
  }

  try {
    if (!spaceId) await loadSpaces();
    const token = await ensureAuthenticated({ name: nombre, email, phone: telefono, password });
    const start_time = hora;
    const payload = {
      space_id: spaceId,
      date: fecha,
      start_time,
      duration_hours: duracion,
      event_type: tipo,
      attendees: asistentes || null,
      comments: comentarios || null,
    };

    const booking = await apiFetch('/bookings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    showAlert(form, 'Reserva enviada. Recibirás confirmación por email.', 'success');
    form.reset();
  } catch (e) {
    showAlert(form, e.message || 'No se pudo enviar la reserva.');
  }
}

function initReservaForm() {
  const form = document.querySelector('#form-reserva');
  if (!form) return;
  form.addEventListener('submit', handleBooking);
  const fecha = form.fecha;
  if (fecha) {
    fecha.addEventListener('change', (e) => {
      populateTimeSlots(e.target.value);
    });
  }
}

// Filtro simple blog (se mantiene)
function inicializarFiltrosBlog() {
  const filtros = document.querySelectorAll('.filter-btn');
  const posts = document.querySelectorAll('.blog-post');
  if (!filtros.length || !posts.length) return;

  filtros.forEach((btn) => {
    btn.addEventListener('click', () => {
      filtros.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const categoria = btn.dataset.categoria;

      posts.forEach((post) => {
        if (categoria === 'todas' || post.dataset.categoria === categoria) {
          post.style.display = 'flex';
        } else {
          post.style.display = 'none';
        }
      });
    });
  });
}

function initCalendarNav() {
  const label = document.querySelector('#mes-actual');
  const prev = document.querySelector('#mes-anterior');
  const next = document.querySelector('#mes-siguiente');
  const updateLabel = () => {
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    label.textContent = formatter.format(currentMonthDate);
  };
  const load = async () => {
    const month = currentMonthDate.toISOString().slice(0, 7);
    availabilityCache = {};
    await loadCalendar(month);
  };
  if (prev && next && label) {
    prev.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      updateLabel();
      load();
    });
    next.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      updateLabel();
      load();
    });
    updateLabel();
  } else {
    loadCalendar(new Date().toISOString().slice(0, 7));
  }
  load();
}

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  initReservaForm();
  inicializarFiltrosBlog();

  // Initialize AOS
  if (window.AOS) {
    AOS.init({
      once: true,
      offset: 50,
      duration: 800,
      easing: 'ease-out-cubic',
    });
  }

  // Navbar scroll effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Cargar calendario dinámico del mes actual
  const month = new Date().toISOString().slice(0, 7);
  loadCalendar(month).then(() => {
    const form = document.querySelector('#form-reserva');
    if (form && form.fecha.value) {
      populateTimeSlots(form.fecha.value);
    }
  });
});
