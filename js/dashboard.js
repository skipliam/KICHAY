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

// ══════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE VISTAS (Inicio / Historia)
// ══════════════════════════════════════════════════════════════
window.abrirVistaHistoria = function() {
  var viewInicio   = document.getElementById("view-inicio");
  var viewHistoria = document.getElementById("view-historia");
  var navInicio    = document.getElementById("nav-inicio");
  var navHistoria  = document.getElementById("nav-historia");

  if (viewInicio)   viewInicio.style.display   = "none";
  if (viewHistoria) {
    viewHistoria.style.display = "flex";
    viewHistoria.scrollTop     = 0;
  }

  // Actualizar clase activa en sidebar
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(function(el) {
    el.classList.remove("active");
  });
  if (navHistoria) navHistoria.classList.add("active");

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.abrirVistaInicio = function() {
  var viewInicio   = document.getElementById("view-inicio");
  var viewHistoria = document.getElementById("view-historia");
  var navInicio    = document.getElementById("nav-inicio");

  if (viewHistoria) viewHistoria.style.display = "none";
  if (viewInicio)   viewInicio.style.display   = "flex";

  // Actualizar clase activa en sidebar
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(function(el) {
    el.classList.remove("active");
  });
  if (navInicio) navInicio.classList.add("active");

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

// ══════════════════════════════════════════════════════════════
// MODAL: PRÓXIMAMENTE DISPONIBLE
// ══════════════════════════════════════════════════════════════
window.abrirModalProximamente = function(nombreSeccion, descripcion) {
  var modal = document.getElementById("modalProximamente");
  var tag   = document.getElementById("modalSeccionNombre");
  var texto = document.getElementById("modalSeccionTexto");

  if (tag) tag.textContent = nombreSeccion || "Próximamente";
  if (texto && descripcion) {
    texto.textContent = descripcion + " ¡Kusi está preparando increíbles retos y leyendas para esta sección!";
  }

  if (modal) modal.style.display = "flex";

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.cerrarModalProximamente = function(e) {
  if (e && e.target && e.target.id !== "modalProximamente" && !e.target.classList.contains("modal-btn-confirm")) return;
  var modal = document.getElementById("modalProximamente");
  if (modal) modal.style.display = "none";

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

// ══════════════════════════════════════════════════════════════
// MODAL: DETALLE DE NIVEL (MAPA DE HISTORIA)
// ══════════════════════════════════════════════
var _nivelSeleccionado = null;

window.abrirModalNivel = function(numNivel, titulo, descripcion, estrellas, desbloqueado, intis, exp) {
  _nivelSeleccionado = { numNivel: numNivel, desbloqueado: desbloqueado, intis: intis, exp: exp };

  var modal    = document.getElementById("modalNivel");
  var badge    = document.getElementById("modalNivelBadge");
  var titleEl  = document.getElementById("modalNivelTitulo");
  var descEl   = document.getElementById("modalNivelDesc");
  var starsEl  = document.getElementById("modalNivelEstrellas");
  var intisEl  = document.getElementById("modalNivelIntis");
  var expEl    = document.getElementById("modalNivelExp");
  var btnEl    = document.getElementById("modalNivelBtnAction");

  if (badge)   badge.textContent   = "NIVEL " + numNivel;
  if (titleEl) titleEl.textContent = titulo;
  if (descEl)  descEl.textContent  = descripcion;
  if (starsEl) starsEl.textContent = estrellas || "⭐⭐⭐";
  if (intisEl) intisEl.textContent = "+" + (intis || 30);
  if (expEl)   expEl.textContent   = "+" + (exp || 50);

  if (btnEl) {
    if (desbloqueado) {
      btnEl.className   = "btn-play-level";
      btnEl.textContent = "¡Comenzar Aventura! ⚔️";
      btnEl.disabled    = false;
    } else {
      btnEl.className   = "btn-play-level btn-locked";
      btnEl.textContent = "🔒 Completa el nivel anterior";
      btnEl.disabled    = true;
    }
  }

  if (modal) modal.style.display = "flex";

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.cerrarModalNivel = function(e) {
  if (e && e.target && e.target.id !== "modalNivel" && !e.target.classList.contains("level-modal-close")) return;
  var modal = document.getElementById("modalNivel");
  if (modal) modal.style.display = "none";

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

window.iniciarAventuraNivel = function() {
  if (!_nivelSeleccionado || !_nivelSeleccionado.desbloqueado) return;
  
  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }

  var btn = document.getElementById("modalNivelBtnAction");
  if (btn) {
    btn.textContent = "¡Cargando lección interactiva... 🇵🇪!";
    btn.style.opacity = "0.75";
  }

  setTimeout(function() {
    alert("¡Excelente! Has iniciado el Nivel " + _nivelSeleccionado.numNivel + ". Las preguntas interactivas estarán disponibles en la siguiente actualización.");
    cerrarModalNivel();
    if (btn) {
      btn.textContent = "¡Comenzar Aventura! ⚔️";
      btn.style.opacity = "1";
    }
  }, 350);
};

// ══════════════════════════════════════════════════════════════
// MODAL: COFRE DEL TESORO DE INTIS
// ══════════════════════════════════════════════
var _cofreValor = 50;

window.abrirModalCofre = function(valor, titulo) {
  _cofreValor = valor || 50;
  var modal = document.getElementById("modalCofre");
  var tit   = document.getElementById("modalCofreTitulo");
  if (tit && titulo) tit.textContent = "¡" + titulo + "!";
  if (modal) modal.style.display = "flex";

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.cerrarModalCofre = function(e) {
  if (e && e.target && e.target.id !== "modalCofre") return;
  var modal = document.getElementById("modalCofre");
  if (modal) modal.style.display = "none";
};

window.reclamarCofre = function() {
  var hudIntis = document.getElementById("hud-intis");
  if (hudIntis) {
    var actual = parseInt(hudIntis.textContent) || 0;
    var nuevo  = actual + _cofreValor;
    hudIntis.textContent = nuevo;
    sessionStorage.setItem("kichay_intis", nuevo);
  }

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }

  alert("¡Felicidades! Ganaste +" + _cofreValor + " INTIS 🪙 por explorar el camino.");
  cerrarModalCofre();
};
