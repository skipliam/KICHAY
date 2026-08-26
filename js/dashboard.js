/* ================================================================
   KICHAY - Dashboard Script
   Patron: import() dinamico de Firebase + fallback sessionStorage
================================================================ */

// ── Helpers UI ───────────────────────────────────────────────────
function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function poblarDashboard(datos, racha) {
  var nombre = datos.nombre || "Explorador";
  setEl("nombre-usuario",  nombre);
  setEl("avatar-initial",  nombre.charAt(0).toUpperCase());
  setEl("hud-racha",       racha !== undefined ? racha : (datos.racha || 0));
  setEl("hud-intis",       datos.intis || 0);

  var nivel  = datos.nivelKusi || 1;
  var exp    = datos.expKusi   || 0;
  var expMax = nivel * 100;
  var expPct = Math.min(Math.round((exp / expMax) * 100), 100);
  setEl("kusi-level-text", "Nivel " + nivel);
  setEl("kusi-exp-pct",    expPct + "%");
  var kusiBar = document.querySelector(".kusi-bar-fill");
  if (kusiBar) kusiBar.style.width = expPct + "%";

  // Progreso materias
  var p = datos.progreso || {};
  var materias = ["historia", "fauna", "gastronomia", "cultura", "turismo"];
  materias.forEach(function(key) {
    var card = document.querySelector("[data-materia='" + key + "']");
    if (!card) return;
    var pct  = p[key] || 0;
    var fill = card.querySelector(".card-progress-fill");
    var pctEl= card.querySelector(".card-pct");
    if (fill) fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
  });
}

// ── Fallback: mostrar datos de sessionStorage mientras carga ─────
(function fallbackImmediate() {
  var nombre = sessionStorage.getItem("kichay_user") || "Explorador";
  var racha  = sessionStorage.getItem("kichay_racha") || "0";
  var intis  = sessionStorage.getItem("kichay_intis") || "0";
  setEl("nombre-usuario", nombre);
  setEl("avatar-initial", nombre.charAt(0).toUpperCase());
  setEl("hud-racha",  racha);
  setEl("hud-intis",  intis);
})();

// ── Cargar Firebase y datos reales de Firestore ──────────────────
var firebaseUrl = new URL("./firebase.js", document.currentScript
  ? document.currentScript.src
  : location.href).href;

import(firebaseUrl).then(function(mod) {

  // Escuchar estado de autenticacion
  mod.onAuthStateChanged(mod.auth, function(fbUser) {
    if (!fbUser) {
      // Sin sesion Firebase: verificar modo local
      if (!sessionStorage.getItem("kichay_uid") || !sessionStorage.getItem("kichay_perfil_completo")) {
        window.location.replace("index.html");
      }
      return;
    }

    // Cargar datos de Firestore
    mod.obtenerUsuario(fbUser.uid).then(function(datos) {
      if (!datos) return;

      // Actualizar racha diaria
      mod.actualizarAcceso(fbUser.uid, datos.racha || 0, datos.ultimoAcceso || null)
        .then(function(nuevaRacha) {
          sessionStorage.setItem("kichay_racha", nuevaRacha);
          sessionStorage.setItem("kichay_user",  datos.nombre || fbUser.displayName || "Explorador");
          poblarDashboard(datos, nuevaRacha);
        });
    }).catch(function(err) {
      console.warn("[KICHAY] Error Firestore, usando sessionStorage:", err);
    });
  });

  // ── Cerrar sesion ──────────────────────────────────────────────
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      document.body.classList.add("page-exit");
      setTimeout(function() {
        if (window.google && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
        }
        mod.cerrarSesion().then(function() {
          window.location.href = "index.html";
        }).catch(function() {
          sessionStorage.clear();
          window.location.href = "index.html";
        });
      }, 400);
    });
  }

}).catch(function(err) {
  console.error("[KICHAY] Error cargando Firebase en dashboard:", err);
  // Fallback: cerrar sesion sin Firebase
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      document.body.classList.add("page-exit");
      setTimeout(function() {
        if (window.google && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
        }
        sessionStorage.clear();
        window.location.href = "index.html";
      }, 400);
    });
  }
});

// ── Menu lateral movil (Drawer) ──────────────────────────────────
function toggleMobileSidebar(open) {
  var sidebar  = document.getElementById("mainSidebar");
  var backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar || !backdrop) return;
  sidebar.classList.toggle("open", open);
  backdrop.classList.toggle("active", open);
}

var mobileMenuBtn   = document.getElementById("mobileMenuBtn");
var sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
var sidebarBackdrop = document.getElementById("sidebarBackdrop");

if (mobileMenuBtn)   mobileMenuBtn.addEventListener("click",   function() { toggleMobileSidebar(true);  });
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", function() { toggleMobileSidebar(false); });
if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", function() { toggleMobileSidebar(false); });

document.querySelectorAll(".sidebar-nav .nav-item").forEach(function(item) {
  item.addEventListener("click", function() {
    if (window.innerWidth <= 768) toggleMobileSidebar(false);
  });
});
