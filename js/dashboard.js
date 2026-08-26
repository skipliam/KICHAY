/* ================================================================
   KICHAY - Dashboard Script (con Firebase Firestore)
================================================================ */
import {
  auth, onAuthStateChanged, obtenerUsuario, actualizarAcceso, cerrarSesion
} from "./firebase.js";

// ─────────────────────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────────────────────
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setWidth(selector, pct) {
  const el = document.querySelector(selector);
  if (el) el.style.width = pct + "%";
}

function setPct(selector, pct) {
  const el = document.querySelector(selector);
  if (el) el.textContent = pct + "%";
}

// ─────────────────────────────────────────────────────────────
// Poblar UI con datos del usuario
// ─────────────────────────────────────────────────────────────
function poblaDashboard(datos, racha) {
  const nombre = datos.nombre || "Explorador";

  // Saludo y avatar
  setEl("nombre-usuario",  nombre);
  setEl("avatar-initial",  nombre.charAt(0).toUpperCase());

  // HUD stats
  setEl("hud-racha",  racha ?? datos.racha ?? 0);
  setEl("hud-intis",  datos.intis ?? 0);

  // Kusi nivel y barra de experiencia
  const nivel    = datos.nivelKusi || 1;
  const exp      = datos.expKusi   || 0;
  const expMax   = nivel * 100;
  const expPct   = Math.min(Math.round((exp / expMax) * 100), 100);
  setEl("kusi-level-text",   "Nivel " + nivel);
  setEl("kusi-exp-pct",      expPct + "%");
  setWidth(".kusi-bar-fill", expPct);

  // Progreso de materias
  const p = datos.progreso || {};
  const materias = [
    { key: "historia",    color: "#5E2CA5" },
    { key: "fauna",       color: "#1E7E34" },
    { key: "gastronomia", color: "#E67E22" },
    { key: "cultura",     color: "#D9381E" },
    { key: "turismo",     color: "#0088CC" }
  ];
  materias.forEach(({ key }) => {
    const pct = p[key] || 0;
    const card = document.querySelector(`[data-materia="${key}"]`);
    if (!card) return;
    const fill = card.querySelector(".card-progress-fill");
    const pctEl = card.querySelector(".card-pct");
    if (fill) fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
  });
}

// ─────────────────────────────────────────────────────────────
// Cargar datos al iniciar
// ─────────────────────────────────────────────────────────────
async function iniciarDashboard(fbUser) {
  let datos = await obtenerUsuario(fbUser.uid);
  if (!datos) {
    // Fallback: usar sessionStorage si Firestore falla
    datos = {
      nombre:   sessionStorage.getItem("kichay_user") || "Explorador",
      racha:    parseInt(sessionStorage.getItem("kichay_racha") || "0"),
      intis:    parseInt(sessionStorage.getItem("kichay_intis") || "0"),
      nivelKusi: 1, expKusi: 0, progreso: {}
    };
  }

  // Actualizar racha del día actual
  const nuevaRacha = await actualizarAcceso(
    fbUser.uid,
    datos.racha || 0,
    datos.ultimoAcceso || null
  );

  sessionStorage.setItem("kichay_racha", nuevaRacha);
  sessionStorage.setItem("kichay_user",  datos.nombre);

  poblaDashboard(datos, nuevaRacha);
}

// ─────────────────────────────────────────────────────────────
// Auth State: esperar a que Firebase confirme sesión
// ─────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (fbUser) => {
  if (fbUser) {
    iniciarDashboard(fbUser).catch(err => {
      // Si Firestore falla (ej. prueba local sin red), usar sessionStorage
      console.warn("Firestore no disponible, usando sessionStorage:", err);
      const nombre = sessionStorage.getItem("kichay_user") || "Explorador";
      const racha  = sessionStorage.getItem("kichay_racha") || "0";
      const intis  = sessionStorage.getItem("kichay_intis") || "0";
      setEl("nombre-usuario", nombre);
      setEl("avatar-initial", nombre.charAt(0).toUpperCase());
      setEl("hud-racha",  racha);
      setEl("hud-intis",  intis);
    });
  } else {
    // No hay sesión Firebase → intentar con sessionStorage (modo local)
    const uid = sessionStorage.getItem("kichay_uid");
    if (!uid || !sessionStorage.getItem("kichay_perfil_completo")) {
      window.location.replace("index.html");
      return;
    }
    // Modo local sin Firebase Auth
    const nombre = sessionStorage.getItem("kichay_user") || "Explorador";
    const racha  = sessionStorage.getItem("kichay_racha") || "0";
    const intis  = sessionStorage.getItem("kichay_intis") || "0";
    setEl("nombre-usuario", nombre);
    setEl("avatar-initial", nombre.charAt(0).toUpperCase());
    setEl("hud-racha",  racha);
    setEl("hud-intis",  intis);
  }
});

// ─────────────────────────────────────────────────────────────
// Cerrar sesión con transición
// ─────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    document.body.classList.add("page-exit");
    setTimeout(async () => {
      await cerrarSesion();
      window.location.href = "index.html";
    }, 400);
  });
}

// ─────────────────────────────────────────────────────────────
// Menú lateral móvil (Drawer)
// ─────────────────────────────────────────────────────────────
const mobileMenuBtn   = document.getElementById("mobileMenuBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const mainSidebar     = document.getElementById("mainSidebar");

function toggleMobileSidebar(open) {
  if (!mainSidebar || !sidebarBackdrop) return;
  mainSidebar.classList.toggle("open", open);
  sidebarBackdrop.classList.toggle("active", open);
}

if (mobileMenuBtn)   mobileMenuBtn.addEventListener("click",   () => toggleMobileSidebar(true));
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", () => toggleMobileSidebar(false));
if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", () => toggleMobileSidebar(false));

document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) toggleMobileSidebar(false);
  });
});
