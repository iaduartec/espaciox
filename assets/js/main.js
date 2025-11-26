/**
 * API Helper class to manage network requests
 */
class ApiService {
  constructor(baseUrl) {
    // Fallback to prod API if nothing is provided to avoid relative requests
    this.baseUrl = (baseUrl || 'https://espaciox.onrender.com/api').replace(/\/$/, '');
  }

  buildUrl(path) {
    return `${this.baseUrl}${path}`;
  }

  async fetch(path, options = {}) {
    let resp;
    try {
      resp = await fetch(this.buildUrl(path), {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });
    } catch (error) {
      console.error('Network error', error);
      throw new Error('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.');
    }

    const raw = await resp.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      throw new Error(data?.message || 'Error de servidor');
    }

    if (data === null) {
      throw new Error('Respuesta no válida del servidor');
    }

    return data;
  }
}

/**
 * Authentication Manager
 */
class AuthManager {
  constructor(apiService) {
    this.api = apiService;
    this.tokenKey = 'espaciox_token';
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  async ensureAuthenticated(payload) {
    const token = this.getToken();
    if (token) return token;

    try {
      // Try login first
      const login = await this.api.fetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      this.setToken(login.token);
      return login.token;
    } catch (e) {
      // If login fails, try registration
      const register = await this.api.fetch('/register', {
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
}

/**
 * Main Application Logic
 */
class App {
  constructor() {
    this.api = new ApiService(this.resolveApiBaseUrl());
    this.auth = new AuthManager(this.api);
    this.spaceId = null;
    this.availabilityCache = {};
    this.currentMonthDate = new Date();
    this.submissionBtn = null;

    this.init();
  }

  init() {
    this.initMobileNav();
    this.initReservaForm();
    this.initBlogFilters();
    this.initCalendarNav();
    this.initAOS();
    this.initScrollEffect();
  }

  resolveApiBaseUrl() {
    if (typeof window !== 'undefined' && typeof window.ESPACIOX_API_BASE === 'string' && window.ESPACIOX_API_BASE.trim()) {
      return window.ESPACIOX_API_BASE.trim();
    }

    const meta = document.querySelector('meta[name="api-base"]');
    if (meta?.content?.trim()) return meta.content.trim();

    return 'https://espaciox.onrender.com/api';
  }

  initMobileNav() {
    const navToggle = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.mobile-nav');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', navMenu.classList.contains('open'));
      });

      navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navToggle.click();
      });
    }
  }

  async loadSpaces() {
    if (this.spaceId) return;
    const data = await this.api.fetch('/spaces');
    const first = data.data?.[0];
    if (!first) throw new Error('No hay espacios activos');
    this.spaceId = first.id;
  }

  async loadCalendar(month) {
    await this.loadSpaces();
    const calendarEl = document.querySelector('#calendario-disponibilidad');
    if (!calendarEl) return;

    calendarEl.innerHTML = '<p>Cargando calendario...</p>';
    try {
      const data = await this.api.fetch(`/spaces/${this.spaceId}/calendar?month=${month}`);
      this.renderCalendar(calendarEl, data.data || []);
    } catch (e) {
      calendarEl.innerHTML = `<p class="alert error">No se pudo cargar el calendario.</p>`;
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
          this.populateTimeSlots(day.date);
        }
      });
      container.appendChild(div);
    });
  }

  async loadAvailability(date) {
    if (!this.spaceId || !date) return;
    if (this.availabilityCache[date]) return this.availabilityCache[date];

    const data = await this.api.fetch(`/spaces/${this.spaceId}/availability?date=${date}`);
    this.availabilityCache[date] = data.data || [];
    return this.availabilityCache[date];
  }

  async populateTimeSlots(date) {
    const select = document.querySelector('#hora');
    if (!select) return;

    if (!date) {
      select.innerHTML = '<option value="">Selecciona fecha primero</option>';
      return;
    }

    select.innerHTML = '<option value="">Cargando horarios...</option>';
    try {
      const slots = await this.loadAvailability(date);
      if (!Array.isArray(slots)) {
        select.innerHTML = '<option value="">No hay horarios disponibles</option>';
        return;
      }
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
      select.selectedIndex = 0;
    } catch (e) {
      select.innerHTML = '<option value="">Error cargando horarios</option>';
    }
  }

  showAlert(form, message, type = 'error') {
    let alert = form.querySelector('.alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.classList.add('alert');
      alert.setAttribute('role', 'status');
      alert.setAttribute('aria-live', 'polite');
      form.appendChild(alert);
    }
    alert.textContent = message;
    alert.className = `alert ${type}`;
  }

  toggleSubmitting(form, isSubmitting) {
    if (!this.submissionBtn) {
      this.submissionBtn = form.querySelector('button[type="submit"]');
      if (this.submissionBtn) {
        this.submissionBtn.dataset.originalText = this.submissionBtn.textContent;
      }
    }

    if (this.submissionBtn) {
      this.submissionBtn.disabled = isSubmitting;
      this.submissionBtn.classList.toggle('loading', isSubmitting);
      this.submissionBtn.textContent = isSubmitting
        ? this.submissionBtn.dataset.loadingText || 'Enviando...'
        : this.submissionBtn.dataset.originalText;
    }
  }

  validateBooking(data) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    const phoneDigits = data.telefono.replace(/\D/g, '');

    if (data.honeypot) return 'Hemos detectado un envío automatizado.';
    if (!data.nombre || !data.email || !data.telefono || !data.password) {
      return 'Completa los campos obligatorios y acepta las normas.';
    }
    if (!emailValid) return 'Introduce un email válido.';
    if (phoneDigits.length < 9) return 'Indica un teléfono de contacto con al menos 9 dígitos.';
    if (data.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!data.fecha || !data.hora || !data.normas) {
      return 'Selecciona fecha, hora y acepta las normas para continuar.';
    }
    return null;
  }

  async handleBooking(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const data = {
      nombre: formData.get('nombre').trim(),
      email: formData.get('email').trim(),
      telefono: formData.get('telefono').trim(),
      password: formData.get('password').trim(),
      fecha: formData.get('fecha'),
      hora: formData.get('hora'),
      duracion: Number(formData.get('duracion') || 2),
      tipo: formData.get('tipo'),
      asistentes: formData.get('asistentes') ? Number(formData.get('asistentes')) : null,
      comentarios: formData.get('comentarios').trim(),
      normas: form.querySelector('#normas').checked,
      honeypot: (formData.get('empresa') || '').trim(),
    };

    const validationError = this.validateBooking(data);
    if (validationError) {
      this.showAlert(form, validationError);
      return;
    }

    this.toggleSubmitting(form, true);
    try {
      await this.loadSpaces();

      const token = await this.auth.ensureAuthenticated({
        name: data.nombre,
        email: data.email,
        phone: data.telefono,
        password: data.password,
      });

      if (!token) throw new Error('No se pudo autenticar al usuario.');

      const payload = {
        space_id: this.spaceId,
        date: data.fecha,
        start_time: data.hora,
        duration_hours: data.duracion,
        event_type: data.tipo,
        attendees: data.asistentes,
        comments: data.comentarios,
        customer_name: data.nombre,
        customer_email: data.email,
        customer_phone: data.telefono,
      };

      await this.api.fetch('/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      this.showAlert(form, 'Reserva enviada correctamente. ¡Gracias!', 'success');
      form.reset();
      this.populateTimeSlots('');
    } catch (e) {
      console.error(e);
      this.showAlert(form, e.message || 'No se pudo enviar la reserva.');
    } finally {
      this.toggleSubmitting(form, false);
    }
  }

  initReservaForm() {
    const form = document.querySelector('#form-reserva');
    if (!form) return;

    form.addEventListener('submit', (e) => this.handleBooking(e));

    const fecha = form.fecha;
    if (fecha) {
      fecha.addEventListener('change', (e) => {
        this.populateTimeSlots(e.target.value);
      });
    }
  }

  initBlogFilters() {
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

  initCalendarNav() {
    const label = document.querySelector('#mes-actual');
    const prev = document.querySelector('#mes-anterior');
    const next = document.querySelector('#mes-siguiente');

    const updateLabel = () => {
      const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
      label.textContent = formatter.format(this.currentMonthDate);
    };

    const load = async () => {
      const month = this.currentMonthDate.toISOString().slice(0, 7);
      this.availabilityCache = {};
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
    } else {
      this.loadCalendar(new Date().toISOString().slice(0, 7));
    }
    load();
  }

  initAOS() {
    if (window.AOS) {
      AOS.init({
        once: true,
        offset: 50,
        duration: 800,
        easing: 'ease-out-cubic',
      });
    }
  }

  initScrollEffect() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
