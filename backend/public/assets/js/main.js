class App {
  constructor() {
    this.apiBase = this.resolveApiBase();
    this.spaceId = null;
    this.availabilityCache = new Map();
    this.currentMonthDate = new Date();
  }

  resolveApiBase() {
    const metaBase = document.querySelector('meta[name="espaciox-api-base"]')?.content;
    const override = typeof window.ESPACIOX_API_BASE === 'string' ? window.ESPACIOX_API_BASE : metaBase;
    const base = (override || '').trim();
    if (base) return base.replace(/\/$/, '');
    return `${window.location.origin}/api`;
  }

  storageReady() {
    try {
      const key = '__storage_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  setToken(token) {
    if (this.storageReady()) localStorage.setItem('espaciox_token', token);
  }

  getToken() {
    if (!this.storageReady()) return null;
    return localStorage.getItem('espaciox_token');
  }

  clearToken() {
    if (this.storageReady()) localStorage.removeItem('espaciox_token');
  }

  async apiFetch(path, options = {}) {
    const resp = await fetch(`${this.apiBase}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const raw = await resp.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_) {
      data = null;
    }

    if (!resp.ok) {
      const message = data?.message || 'Error de servidor';
      throw new Error(message);
    }

    if (data === null) {
      throw new Error('Respuesta no válida del servidor');
    }

    return data;
  }

  async ensureAuthenticated(payload) {
    const token = this.getToken();
    if (token) return token;

    try {
      const login = await this.apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      this.setToken(login.token);
      return login.token;
    } catch (_) {
      const register = await this.apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
          password_confirmation: payload.password,
        }),
      });
      this.setToken(register.token);
      return register.token;
    }
  }

  async loadSpaces() {
    const data = await this.apiFetch('/spaces');
    const first = data.data?.[0];
    if (!first) throw new Error('No hay espacios activos');
    this.spaceId = first.id;
    return first;
  }

  async loadCalendar(month) {
    const calendarEl = document.querySelector('#calendario-disponibilidad');
    if (!calendarEl) return;

    if (!this.spaceId) await this.loadSpaces();

    calendarEl.setAttribute('aria-busy', 'true');
    calendarEl.innerHTML = '<p>Cargando calendario...</p>';

    try {
      const data = await this.apiFetch(`/spaces/${this.spaceId}/calendar?month=${month}`);
      this.renderCalendar(calendarEl, data.data || []);
    } catch (e) {
      calendarEl.innerHTML = `<p class="alert error" role="alert">${e.message || 'No se pudo cargar el calendario.'}</p>`;
    } finally {
      calendarEl.removeAttribute('aria-busy');
    }
  }

  renderCalendar(container, days) {
    const headers = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    container.innerHTML = '';
    headers.forEach((h) => {
      const div = document.createElement('div');
      div.className = 'weekday';
      div.textContent = h;
      container.appendChild(div);
    });

    if (!days.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'alert';
      emptyState.textContent = 'Sin datos de calendario.';
      container.appendChild(emptyState);
      return;
    }

    const firstDay = new Date(days[0].date);
    const offset = ((firstDay.getDay() || 7) - 1 + 7) % 7; // lunes=0
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('div');
      empty.className = 'day empty';
      empty.setAttribute('aria-hidden', 'true');
      container.appendChild(empty);
    }

    days.forEach((day) => {
      const div = document.createElement('div');
      div.className = 'day';
      div.dataset.date = day.date;
      div.textContent = new Date(day.date).getDate();
      div.setAttribute('role', 'button');
      div.tabIndex = 0;

      if (day.status === 'booked') div.classList.add('ocupado');
      if (day.status === 'blocked') div.classList.add('bloqueado');

      const selectDate = () => {
        const form = document.querySelector('#form-reserva');
        if (form && form.fecha) {
          form.fecha.value = day.date;
          this.populateTimeSlots(day.date);
          form.fecha.dispatchEvent(new Event('input'));
        }
      };

      div.addEventListener('click', selectDate);
      div.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectDate();
        }
      });

      container.appendChild(div);
    });
  }

  async loadAvailability(date) {
    if (!this.spaceId || !date) return [];
    if (this.availabilityCache.has(date)) return this.availabilityCache.get(date);

    const data = await this.apiFetch(`/spaces/${this.spaceId}/availability?date=${date}`);
    const slots = data.data || [];
    this.availabilityCache.set(date, slots);
    return slots;
  }

  async populateTimeSlots(date) {
    const select = document.querySelector('#hora');
    if (!select) return;

    select.innerHTML = '<option value="">Cargando horarios...</option>';
    select.disabled = true;

    try {
      const slots = await this.loadAvailability(date);
      const freeSlots = slots.filter((s) => s.status === 'free');
      if (!freeSlots.length) {
        select.innerHTML = '<option value="">Sin huecos libres</option>';
        return;
      }
      select.innerHTML = '<option value="">Selecciona una hora</option>';
      freeSlots.forEach((slot) => {
        const opt = document.createElement('option');
        opt.value = slot.start_time;
        opt.textContent = `${slot.start_time} - ${slot.end_time}`;
        select.appendChild(opt);
      });
    } catch (e) {
      select.innerHTML = `<option value="">${e.message || 'Error cargando horarios'}</option>`;
    } finally {
      select.disabled = false;
    }
  }

  showAlert(form, message, type = 'error') {
    let alert = form.querySelector('.alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.classList.add('alert');
      alert.setAttribute('role', 'status');
      alert.setAttribute('aria-live', 'polite');
      form.prepend(alert);
    }
    alert.textContent = message;
    alert.className = `alert ${type}`;
  }

  setSubmitting(form, state) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = state;
    button.classList.toggle('is-loading', state);
    button.setAttribute('aria-busy', state ? 'true' : 'false');
  }

  async handleBooking(event) {
    event.preventDefault();
    const form = event.target;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

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

    if (!normas) {
      this.showAlert(form, 'Debes aceptar las normas de uso.');
      return;
    }

    try {
      this.setSubmitting(form, true);
      if (!this.spaceId) await this.loadSpaces();
      const token = await this.ensureAuthenticated({ name: nombre, email, phone: telefono, password });

      const payload = {
        space_id: this.spaceId,
        date: fecha,
        start_time: hora,
        duration_hours: duracion,
        event_type: tipo,
        attendees: asistentes || null,
        comments: comentarios || null,
      };

      await this.apiFetch('/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      this.showAlert(form, 'Reserva enviada. Recibirás confirmación por email.', 'success');
      form.reset();
      this.availabilityCache.clear();
    } catch (e) {
      if (e.message?.includes('token')) this.clearToken();
      this.showAlert(form, e.message || 'No se pudo enviar la reserva.');
    } finally {
      this.setSubmitting(form, false);
    }
  }

  initReservaForm() {
    const form = document.querySelector('#form-reserva');
    if (!form) return;

    form.addEventListener('submit', (event) => this.handleBooking(event));

    const fecha = form.fecha;
    if (fecha) {
      const today = new Date().toISOString().slice(0, 10);
      fecha.min = today;
      fecha.addEventListener('change', (e) => {
        this.populateTimeSlots(e.target.value);
      });
    }
  }

  inicializarFiltrosBlog() {
    const filtros = document.querySelectorAll('.filter-btn');
    const posts = document.querySelectorAll('.blog-post');
    if (!filtros.length || !posts.length) return;

    filtros.forEach((btn) => {
      btn.addEventListener('click', () => {
        filtros.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const categoria = btn.dataset.categoria;

        posts.forEach((post) => {
          const visible = categoria === 'todas' || post.dataset.categoria === categoria;
          post.style.display = visible ? 'flex' : 'none';
        });
      });
    });
  }

  initCalendarNav() {
    const label = document.querySelector('#mes-actual');
    const prev = document.querySelector('#mes-anterior');
    const next = document.querySelector('#mes-siguiente');

    const updateLabel = () => {
      if (!label) return;
      const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
      label.textContent = formatter.format(this.currentMonthDate);
    };

    const load = async () => {
      const month = this.currentMonthDate.toISOString().slice(0, 7);
      this.availabilityCache.clear();
      await this.loadCalendar(month);
    };

    if (prev && next && label) {
      prev.addEventListener('click', () => {
        this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
        updateLabel();
        load();
      });
      next.addEventListener('click', () => {
        this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
        updateLabel();
        load();
      });
      updateLabel();
    }

    load();
  }

  initNav() {
    const navToggle = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.mobile-nav');
    const body = document.body;

    if (navToggle && navMenu) {
      const toggleNav = () => {
        navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', navMenu.classList.contains('open'));
        body.classList.toggle('nav-open', navMenu.classList.contains('open'));
      };

      navToggle.addEventListener('click', toggleNav);
      navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') toggleNav();
      });

      navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
          body.classList.remove('nav-open');
        });
      });
    }
  }

  initAnimations() {
    if (window.AOS) {
      AOS.init({
        once: true,
        offset: 50,
        duration: 800,
        easing: 'ease-out-cubic',
      });
    }
  }

  initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  init() {
    this.initNav();
    this.initReservaForm();
    this.inicializarFiltrosBlog();
    this.initCalendarNav();
    this.initAnimations();
    this.initHeaderScroll();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
