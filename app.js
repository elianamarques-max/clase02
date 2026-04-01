/* =====================================================
   CONFIGURACIÓN GLOBAL Y ESTADO
   ===================================================== */
const CONFIG = {
    API_URL: 'http://127.0.0.1:8000'
};

let appState = {
    isLoggedIn: false,
    userEmail: null,
    servicios: []
};

const PROTECTED_TABS = ['servicios', 'mascotas', 'reporte'];

/* =====================================================
   FUNCIONES DE UTILIDAD
   ===================================================== */

/**
 * Muestra una alerta temporal (éxito o error)
 */
function showAlert(message, type = 'success', duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '1000';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.animation = 'slideUpFade 0.3s ease-out';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, duration);
}

/**
 * Realiza una solicitud HTTP a la API
 */
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cambia la sección activa (tab)
 */
function switchTab(tabName) {
    // Validar si el tab está protegido y el usuario no está logueado
    if (PROTECTED_TABS.includes(tabName) && !appState.isLoggedIn) {
        showAlert('Debes iniciar sesión para acceder a este tab', 'error');
        switchTab('acceso');
        return;
    }

    // Remover clase "active" de todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Agregar clase "active" solo a la sección seleccionada
    const targetSection = document.getElementById(tabName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Actualizar nav links activos
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabName) {
            link.classList.add('active');
        }
    });

    // Si es el tab de reporte, pre-llenar el correo del usuario
    if (tabName === 'reporte' && appState.isLoggedIn) {
        document.getElementById('input-reporte-correo').value = appState.userEmail;
    }
}

/**
 * Actualiza el estado de login del usuario
 */
function setUserLoggedIn(email) {
    appState.isLoggedIn = true;
    appState.userEmail = email;

    // Actualizar badge de usuario
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = email;
    }

    // Desbloquear tabs protegidos
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const tabName = link.getAttribute('data-tab');
        if (PROTECTED_TABS.includes(tabName)) {
            link.classList.remove('locked');
        }
    });

    showAlert(`¡Bienvenido ${email}!`, 'success');
}

/**
 * Cierra sesión del usuario
 */
function logout() {
    appState.isLoggedIn = false;
    appState.userEmail = null;

    // Actualizar badge de usuario
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = 'Usuario';
    }

    // Bloquear tabs protegidos
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const tabName = link.getAttribute('data-tab');
        if (PROTECTED_TABS.includes(tabName)) {
            link.classList.add('locked');
        }
    });

    // Limpiar inputs de formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Ir al tab de acceso
    switchTab('acceso');

    showAlert('Has cerrado sesión', 'success');
}

/* =====================================================
   GESTIÓN DE SERVICIOS
   ===================================================== */

/**
 * Carga los servicios disponibles desde la API
 */
async function loadServicios() {
    const result = await apiCall('/servicios');

    if (result.success && result.data.servicios) {
        appState.servicios = result.data.servicios;
        renderServicios();
        updateSelectServicios();
    } else {
        showAlert('Error al cargar servicios', 'error');
    }
}

/**
 * Renderiza la lista de servicios en el HTML
 */
function renderServicios() {
    const listElement = document.getElementById('servicios-lista');
    if (!listElement) return;

    listElement.innerHTML = '';

    if (appState.servicios.length === 0) {
        listElement.innerHTML = '<li style="padding: 16px; text-align: center; color: #6b7280;">No hay servicios disponibles</li>';
        return;
    }

    appState.servicios.forEach(servicio => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${servicio.nombre}</strong>
            </div>
            <div style="color: #0ea5a0; font-weight: 600;">$${parseFloat(servicio.precio).toFixed(2)}</div>
        `;
        listElement.appendChild(li);
    });
}

/**
 * Actualiza el select de servicios en el formulario de mascotas
 */
function updateSelectServicios() {
    const selectElement = document.getElementById('input-mascota-servicio');
    if (!selectElement) return;

    // Mantener la opción por defecto
    const defaultOption = selectElement.querySelector('option[value=""]');
    selectElement.innerHTML = '';
    if (defaultOption) {
        selectElement.appendChild(defaultOption);
    }

    appState.servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.nombre;
        option.textContent = `${servicio.nombre} - $${parseFloat(servicio.precio).toFixed(2)}`;
        selectElement.appendChild(option);
    });
}

/**
 * Maneja el formulario de agregar servicio
 */
async function handleAddServicio(e) {
    e.preventDefault();

    const nombre = document.getElementById('input-servicio-nombre').value;
    const precio = document.getElementById('input-servicio-precio').value;

    if (!nombre || !precio) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }

    const result = await apiCall('/agregar-servicio', 'POST', {
        nombre,
        precio: parseFloat(precio)
    });

    if (result.success) {
        showAlert('Servicio agregado correctamente', 'success');
        document.getElementById('servicio-form').reset();
        await loadServicios();
    } else {
        showAlert('Error al agregar el servicio', 'error');
    }
}

/* =====================================================
   GESTIÓN DE MASCOTAS
   ===================================================== */

/**
 * Maneja el formulario de registrar mascota
 */
async function handleRegisterPet(e) {
    e.preventDefault();

    const correo = document.getElementById('input-mascota-correo').value;
    const nombre = document.getElementById('input-mascota-nombre').value;
    const tipo_servicio = document.getElementById('input-mascota-servicio').value;
    const fecha = document.getElementById('input-mascota-fecha').value;

    if (!correo || !nombre || !tipo_servicio || !fecha) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }

    const result = await apiCall('/registrar-mascota', 'POST', {
        correo,
        nombre,
        tipo_servicio,
        fecha
    });

    if (result.success) {
        showAlert('Mascota registrada correctamente', 'success');
        document.getElementById('mascota-form').reset();
    } else {
        showAlert('Error al registrar la mascota', 'error');
    }
}

/**
 * Busca mascotas por correo
 */
async function handleSearchPets() {
    const correo = document.getElementById('input-buscar-mascota').value;

    if (!correo) {
        showAlert('Por favor ingresa un correo para buscar', 'error');
        return;
    }

    const result = await apiCall(`/mascotas/${correo}`);

    const resultadosDiv = document.getElementById('resultados-mascotas');
    resultadosDiv.innerHTML = '';

    if (result.success && result.data.mascotas) {
        const mascotas = result.data.mascotas;

        if (mascotas.length === 0) {
            resultadosDiv.innerHTML = '<p style="text-align: center; color: #6b7280;">No se encontraron mascotas para este correo</p>';
            return;
        }

        mascotas.forEach(mascota => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h4 style="margin-bottom: 8px; color: #0ea5a0;">${mascota.nombre}</h4>
                <p><strong>Correo:</strong> ${mascota.correo}</p>
                <p><strong>Servicio:</strong> ${mascota.tipo_servicio}</p>
                <p><strong>Fecha:</strong> ${mascota.fecha}</p>
            `;
            resultadosDiv.appendChild(card);
        });
    } else {
        resultadosDiv.innerHTML = '<p style="text-align: center; color: #ef4444;">Error al buscar mascotas</p>';
    }
}

/* =====================================================
   GESTIÓN DE REPORTES
   ===================================================== */

/**
 * Busca y genera reporte por correo
 */
async function handleSearchReport() {
    const correo = document.getElementById('input-reporte-correo').value;

    if (!correo) {
        showAlert('Por favor ingresa un correo para generar el reporte', 'error');
        return;
    }

    const result = await apiCall(`/reporte/${correo}`);

    const areaResultados = document.getElementById('area-resultados-reporte');
    areaResultados.innerHTML = '';

    if (result.success && result.data) {
        const reporte = result.data;

        areaResultados.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <div class="stat-box" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 24px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #065f46;">${reporte.cantidad_servicios}</div>
                    <div style="color: #047857; font-weight: 600; margin-top: 8px;">Servicios Utilizados</div>
                </div>

                <div class="stat-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #92400e;">$${parseFloat(reporte.total_gastado).toFixed(2)}</div>
                    <div style="color: #a16207; font-weight: 600; margin-top: 8px;">Total Gastado</div>
                </div>

                <div class="stat-box" style="background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%); padding: 24px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 14px; font-weight: 700; color: #1e40af; word-break: break-all;">${reporte.correo}</div>
                    <div style="color: #1e3a8a; font-weight: 600; margin-top: 8px;">Correo del Usuario</div>
                </div>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px;">
                <h4 style="margin-bottom: 12px; color: #1f2937;">Servicios Utilizados:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${reporte.servicios && reporte.servicios.length > 0
                        ? reporte.servicios.map(servicio => 
                            `<span style="background-color: #0ea5a0; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${servicio}</span>`
                          ).join('')
                        : '<span style="color: #6b7280;">No hay servicios registrados</span>'
                    }
                </div>
            </div>
        `;
    } else {
        areaResultados.innerHTML = '<p style="text-align: center; color: #ef4444;">Error al generar el reporte</p>';
    }
}

/* =====================================================
   AUTENTICACIÓN
   ===================================================== */

/**
 * Maneja el formulario de registro
 */
async function handleRegister(e) {
    e.preventDefault();

    const correo = document.getElementById('input-registro-email').value;
    const contrasena = document.getElementById('input-registro-password').value;
    const contrasenaConfirm = document.getElementById('input-registro-password-confirm').value;

    if (!correo || !contrasena || !contrasenaConfirm) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }

    if (contrasena !== contrasenaConfirm) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }

    const result = await apiCall('/auth/register', 'POST', {
        correo,
        contraseña: contrasena
    });

    if (result.success) {
        showAlert('Registro exitoso. Por favor inicia sesión', 'success');
        document.getElementById('registro-form').reset();
        document.getElementById('login-form').reset();
    } else {
        showAlert('Error al registrar. El correo podría estar en uso', 'error');
    }
}

/**
 * Maneja el formulario de login
 */
async function handleLogin(e) {
    e.preventDefault();

    const correo = document.getElementById('input-login-email').value;
    const contrasena = document.getElementById('input-login-password').value;

    if (!correo || !contrasena) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }

    const result = await apiCall('/auth/login', 'POST', {
        correo,
        contraseña: contrasena
    });

    if (result.success) {
        setUserLoggedIn(correo);
        document.getElementById('login-form').reset();
        document.getElementById('registro-form').reset();
        // Cargar servicios después de login
        await loadServicios();
        // Cambiar al tab de inicio
        switchTab('inicio');
    } else {
        showAlert('Correo o contraseña incorrectos', 'error');
    }
}

/**
 * Maneja el formulario de saludo (bienvenida)
 */
async function handleWelcome(e) {
    e.preventDefault();

    const nombre = document.getElementById('input-nombre').value;

    if (!nombre) {
        showAlert('Por favor ingresa tu nombre', 'error');
        return;
    }

    const result = await apiCall(`/bienvenido/${encodeURIComponent(nombre)}`);

    if (result.success) {
        showAlert(result.data.mensaje, 'success');
        document.getElementById('welcome-form').reset();
    } else {
        showAlert('Error al saludar', 'error');
    }
}

/* =====================================================
   EVENT LISTENERS Y INICIALIZACIÓN
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Event listeners para navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Event listener para logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Event listeners para formularios
    const welcomeForm = document.getElementById('welcome-form');
    if (welcomeForm) {
        welcomeForm.addEventListener('submit', handleWelcome);
    }

    const registroForm = document.getElementById('registro-form');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const servicioForm = document.getElementById('servicio-form');
    if (servicioForm) {
        servicioForm.addEventListener('submit', handleAddServicio);
    }

    const mascotaForm = document.getElementById('mascota-form');
    if (mascotaForm) {
        mascotaForm.addEventListener('submit', handleRegisterPet);
    }

    const btnBuscarMascota = document.getElementById('btn-buscar-mascota');
    if (btnBuscarMascota) {
        btnBuscarMascota.addEventListener('click', handleSearchPets);
    }

    const btnBuscarReporte = document.getElementById('btn-buscar-reporte');
    if (btnBuscarReporte) {
        btnBuscarReporte.addEventListener('click', handleSearchReport);
    }

    // Inicialización: bloquear tabs protegidos
    const navLinks2 = document.querySelectorAll('.nav-link');
    navLinks2.forEach(link => {
        const tabName = link.getAttribute('data-tab');
        if (PROTECTED_TABS.includes(tabName)) {
            link.classList.add('locked');
        }
    });

    // Mostrar el tab de inicio al cargar
    switchTab('inicio');
});
