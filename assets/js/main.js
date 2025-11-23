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

// Simulador de disponibilidad
const fechasOcupadas = ['2025-02-05', '2025-02-12', '2025-02-18', '2025-02-24'];

function marcarCalendario() {
  const calendar = document.querySelector('.calendar');
  if (!calendar) return;

  const dias = calendar.querySelectorAll('.day');
  dias.forEach((dia) => {
    const dateValue = dia.getAttribute('data-date');
    if (dateValue && fechasOcupadas.includes(dateValue)) {
      dia.classList.add('ocupado');
      dia.setAttribute('aria-label', `${dateValue} ocupado`);
    }
  });
}

// Validación formulario reservas
function validarFormularioReserva(event) {
  event.preventDefault();
  const form = event.target;
  const nombre = form.querySelector('#nombre');
  const email = form.querySelector('#email');
  const telefono = form.querySelector('#telefono');
  const normas = form.querySelector('#normas');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let mensaje = '';
  let tipo = 'success';

  if (!nombre.value.trim() || !email.value.trim() || !telefono.value.trim()) {
    mensaje = 'Por favor, rellena los campos obligatorios.';
    tipo = 'error';
  } else if (!emailRegex.test(email.value.trim())) {
    mensaje = 'El email no tiene un formato válido.';
    tipo = 'error';
  } else if (!normas.checked) {
    mensaje = 'Debes aceptar las normas de uso.';
    tipo = 'error';
  } else {
    mensaje = '¡Reserva enviada! Te contactaremos para confirmar disponibilidad y fianza.';
    form.reset();
  }

  mostrarMensaje(form, mensaje, tipo);
}

function mostrarMensaje(form, mensaje, tipo) {
  let alert = form.querySelector('.alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.classList.add('alert');
    form.appendChild(alert);
  }
  alert.textContent = mensaje;
  alert.className = 'alert ' + tipo;
}

function inicializarFormulario() {
  const form = document.querySelector('#form-reserva');
  if (!form) return;
  form.addEventListener('submit', validarFormularioReserva);
}

// Filtro simple blog
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

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  marcarCalendario();
  inicializarFormulario();
  inicializarFiltrosBlog();

  // Initialize AOS
  AOS.init({
    once: true,
    offset: 50,
    duration: 800,
    easing: 'ease-out-cubic',
  });

  // Navbar scroll effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
});
