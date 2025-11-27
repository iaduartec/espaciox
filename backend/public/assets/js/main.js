/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

class App {
  constructor() {
    this.apiBase = this.resolveApiBase();
    this.spaceId = null;
    this.availabilityCache = new Map();
    this.currentMonthDate = new Date();
    this.currentMonthDate.setDate(1);
    this.selectedDate = null;
    this.slotRequestId = 0;
  }

  resolveApiBase() {
    const metaBase = document.querySelector('meta[name="espaciox-api-base"]')?.content;
    const datasetBase = document.documentElement.dataset.apiBase || document.body.dataset.apiBase;
    const override = typeof window.ESPACIOX_API_BASE === 'string' ? window.ESPACIOX_API_BASE : null;

    let configBase = null;
    const configNode = document.querySelector('#espaciox-config');
    if (configNode?.textContent) {
      try {
        const parsed = JSON.parse(configNode.textContent);
        if (parsed?.apiBase) configBase = parsed.apiBase;
      } catch (_) {
        // ignore malformed JSON
      }
    }

    const baseCandidate = [override, datasetBase, configBase, metaBase].find(
      (value) => typeof value === 'string' && value.trim() !== '',
    );

    if (baseCandidate) return baseCandidate.trim().replace(/\/$/, '');
    return `${window.location.origin}/api`;
  }

  async apiFetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const resp = await fetch(`${this.apiBase}${path}`, {
      headers,
      credentials: 'include',
      ...options,
    });

    const contentType = resp.headers.get('content-type') || '';
    const raw = await resp.text();
    let data = null;

    if (raw && contentType.includes('application/json')) {
      try {
        data = JSON.parse(raw);
      } catch (_) {
        data = null;
      }
    }

    if (!resp.ok) {
      const message = data?.message || `Error ${resp.status}`;
      throw new Error(message);
    }

    return data ?? { ok: true };
  }

  async ensureAuthenticated(payload) {
    try {
      const login = await this.apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
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
      return register.token;
    }
  }

  async loadSpaces() {
    try {
      const data = await this.apiFetch('/spaces');
      const first = data.data?.[0];
      if (!first) throw new Error('No hay espacios activos');
      this.spaceId = first.id;
      return first;
    } catch (e) {
      this.spaceId = 1;
      return { id: 1, name: 'Sala principal', capacity: 40 };
    }
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
    const statusLabels = {
      free: 'Libre',
      booked: 'Ocupado',
      blocked: 'Bloqueado',
    };
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
      const dateObj = new Date(day.date);
      const div = document.createElement('div');
      div.className = 'day';
      div.dataset.date = day.date;
      div.dataset.status = day.status;
      div.textContent = dateObj.getDate();
      div.setAttribute('role', 'button');
      div.tabIndex = 0;

      if (day.status === 'booked') div.classList.add('ocupado');
      if (day.status === 'blocked') div.classList.add('bloqueado');

      const statusLabel = statusLabels[day.status] || statusLabels.free;
      const dateLabel = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(dateObj);
      div.setAttribute('aria-label', `${dateLabel} — ${statusLabel}`);
      div.setAttribute('aria-pressed', this.selectedDate === day.date ? 'true' : 'false');

      const selectDate = () => {
        const form = document.querySelector('#form-reserva');
        if (form && form.fecha) {
          form.fecha.value = day.date;
          this.updateCalendarSelection(day.date);
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

    this.updateCalendarSelection(this.selectedDate);
  }

  updateCalendarSelection(date) {
    this.selectedDate = date || null;
    document.querySelectorAll('.calendar .day').forEach((dayEl) => {
      const isSelected = Boolean(date) && dayEl.dataset.date === date;
      dayEl.classList.toggle('is-selected', isSelected);
      dayEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  async loadAvailability(date) {
    if (!date) return [];
    if (!this.spaceId) await this.loadSpaces();
    if (this.availabilityCache.has(date)) return this.availabilityCache.get(date);

    const data = await this.apiFetch(`/spaces/${this.spaceId}/availability?date=${date}`);
    const slots = data.data || [];
    this.availabilityCache.set(date, slots);
    return slots;
  }

  async populateTimeSlots(date) {
    const select = document.querySelector('#hora');
    if (!select) return;

    if (!date) {
      this.updateCalendarSelection(null);
      select.innerHTML = '<option value="">Selecciona fecha primero</option>';
      select.disabled = false;
      return;
    }

    this.slotRequestId += 1;
    const requestId = this.slotRequestId;
    select.innerHTML = '<option value="">Cargando horarios...</option>';
    select.disabled = true;
    this.updateCalendarSelection(date);

    try {
      const slots = await this.loadAvailability(date);
      if (requestId !== this.slotRequestId) return;
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
      if (requestId === this.slotRequestId) {
        select.disabled = false;
      }
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
    alert.setAttribute('role', type === 'error' ? 'alert' : 'status');
    alert.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
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
      await this.ensureAuthenticated({ name: nombre, email, phone: telefono, password });

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
        body: JSON.stringify(payload),
      });

      this.showAlert(form, 'Reserva enviada. Recibirás confirmación por email.', 'success');
      form.reset();
      this.availabilityCache.clear();
      this.updateCalendarSelection(null);
    } catch (e) {
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
      const today = this.todayString();
      fecha.min = today;
      fecha.addEventListener('change', (e) => {
        this.populateTimeSlots(e.target.value);
      });
      fecha.addEventListener('input', (e) => {
        this.updateCalendarSelection(e.target.value);
      });

      if (fecha.value) {
        this.updateCalendarSelection(fecha.value);
        this.populateTimeSlots(fecha.value);
      }
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
      const month = this.formatMonth(this.currentMonthDate);
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

  todayString() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  formatMonth(date) {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  initNav() {
    const navToggle = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.mobile-nav');
    const body = document.body;

    if (navToggle && navMenu) {
      const closeNav = () => {
        navMenu.classList.remove('open');
        navMenu.hidden = true;
        navToggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('nav-open');
      };

      const toggleNav = () => {
        const isOpen = navMenu.classList.toggle('open');
        navMenu.hidden = !isOpen;
        navToggle.setAttribute('aria-expanded', isOpen);
        body.classList.toggle('nav-open', isOpen);
      };

      navToggle.addEventListener('click', toggleNav);
      navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') toggleNav();
      });

      navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeNav);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navMenu.classList.contains('open')) {
          closeNav();
          navToggle.focus();
        }
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
