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
  var nombre = datos.nombre || sessionStorage.getItem("kichay_user") || "Explorador";
  setEl("nombre-usuario",   nombre);
  setEl("topbar-user-name", nombre);
  setEl("avatar-initial",   nombre.charAt(0).toUpperCase());
  setEl("hud-racha",        racha !== undefined ? racha : (datos.racha || 0));
  setEl("hud-intis",        datos.intis || 0);

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
  setEl("nombre-usuario",   nombre);
  setEl("topbar-user-name", nombre);
  setEl("avatar-initial",   nombre.charAt(0).toUpperCase());
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
// NAVEGACIÓN ENTRE VISTAS (Inicio / Historia / Quiz)
// ══════════════════════════════════════════════════════════════
var _epocaSeleccionada = "preinca";

window.abrirVistaHistoria = function(epocaOpcional) {
  var viewInicio   = document.getElementById("view-inicio");
  var viewHistoria = document.getElementById("view-historia");
  var viewQuiz     = document.getElementById("view-quiz");
  var navInicio    = document.getElementById("nav-inicio");
  var navHistoria  = document.getElementById("nav-historia");

  if (viewInicio)   viewInicio.style.display   = "none";
  if (viewQuiz)     viewQuiz.style.display     = "none";
  if (viewHistoria) {
    viewHistoria.style.display = "flex";
    viewHistoria.scrollTop     = 0;
  }

  // Actualizar clase activa en sidebar
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(function(el) {
    el.classList.remove("active");
  });
  if (navHistoria) navHistoria.classList.add("active");

  if (epocaOpcional) {
    cambiarEpocaHistoria(epocaOpcional);
  } else {
    renderizarNodosHistoria();
  }

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.abrirVistaInicio = function() {
  var viewInicio   = document.getElementById("view-inicio");
  var viewHistoria = document.getElementById("view-historia");
  var viewQuiz     = document.getElementById("view-quiz");
  var navInicio    = document.getElementById("nav-inicio");

  if (viewHistoria) viewHistoria.style.display = "none";
  if (viewQuiz)     viewQuiz.style.display     = "none";
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
// DROPDOWN Y PROGRESIÓN SECUENCIAL DE ÉPOCAS HISTÓRICAS
// ══════════════════════════════════════════════════════════════
window.toggleDropdownEpocas = function(e) {
  if (e) e.stopPropagation();
  var menu = document.getElementById("historiaDropdownMenu");
  var btn  = document.getElementById("historiaDropdownBtn");
  if (!menu) return;

  var estaAbierto = (menu.style.display === "flex");
  if (estaAbierto) {
    menu.style.display = "none";
    if (btn) btn.classList.remove("open");
  } else {
    actualizarEstadoDropdownEpocas();
    menu.style.display = "flex";
    if (btn) btn.classList.add("open");
  }

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

window.cerrarDropdownEpocas = function() {
  var menu = document.getElementById("historiaDropdownMenu");
  var btn  = document.getElementById("historiaDropdownBtn");
  if (menu) menu.style.display = "none";
  if (btn) btn.classList.remove("open");
};

// Cerrar dropdown si se hace clic fuera
document.addEventListener("click", function(e) {
  var wrap = document.querySelector(".historia-dropdown-wrapper");
  if (wrap && !wrap.contains(e.target)) {
    cerrarDropdownEpocas();
  }
});

window.esEpocaDesbloqueada = function(epocaKey) {
  if (epocaKey === "preinca") return true;

  var progresoStr = sessionStorage.getItem("kichay_progreso_historia") || "{}";
  var progreso = {};
  try { progreso = JSON.parse(progresoStr); } catch (err) {}

  if (epocaKey === "inca") {
    // Desbloqueado si terminó Preinca Nivel 5
    return !!(progreso["preinca_5"] || sessionStorage.getItem("unlocked_inca"));
  }
  if (epocaKey === "virreinato") {
    // Desbloqueado si terminó Inca Nivel 5
    return !!(progreso["inca_5"] || sessionStorage.getItem("unlocked_virreinato"));
  }
  if (epocaKey === "emancipacion") {
    // Desbloqueado si terminó Virreinato Nivel 5
    return !!(progreso["virreinato_5"] || sessionStorage.getItem("unlocked_emancipacion"));
  }
  if (epocaKey === "republica") {
    // Desbloqueado si terminó Emancipación Nivel 5
    return !!(progreso["emancipacion_5"] || sessionStorage.getItem("unlocked_republica"));
  }
  return false;
};

window.actualizarEstadoDropdownEpocas = function() {
  var epocas = ["preinca", "inca", "virreinato", "emancipacion", "republica"];
  var nombresPrevios = {
    inca: "Preinca",
    virreinato: "Inca",
    emancipacion: "Virreinato",
    republica: "Emancipación"
  };

  epocas.forEach(function(ep) {
    var item = document.getElementById("drop-item-" + ep);
    var status = document.getElementById("status-" + ep);
    var unlocked = esEpocaDesbloqueada(ep);

    if (item) {
      item.classList.remove("active", "locked");
      if (ep === _epocaSeleccionada) {
        item.classList.add("active");
      }
      if (!unlocked) {
        item.classList.add("locked");
      }
    }

    if (status) {
      if (ep === _epocaSeleccionada) {
        status.textContent = "✓ Época Actual";
      } else if (unlocked) {
        status.textContent = "✓ Desbloqueado";
      } else {
        status.textContent = "🔒 Requiere " + (nombresPrevios[ep] || "") + " Nivel 5";
      }
    }
  });
};

window.seleccionarEpocaDropdown = function(epocaKey) {
  var unlocked = esEpocaDesbloqueada(epocaKey);

  if (!unlocked) {
    var nombresPrevios = {
      inca: "Preinca",
      virreinato: "Imperio Inca",
      emancipacion: "Virreinato",
      republica: "Emancipación"
    };
    alert("🔒 ¡Época Bloqueada! Para desbloquear este capítulo, primero debes completar los 5 niveles del cuestionario de " + (nombresPrevios[epocaKey] || "la época anterior") + ".");
    
    if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
      window.KichaySound.playSoftClick();
    }
    cerrarDropdownEpocas();
    return;
  }

  cerrarDropdownEpocas();
  cambiarEpocaHistoria(epocaKey);
};

window.cambiarEpocaHistoria = function(epocaKey) {
  _epocaSeleccionada = epocaKey || "preinca";

  var badge = document.getElementById("historiaEpocaBadge");
  if (badge) {
    var titulos = {
      preinca: "PREINCA",
      inca: "IMPERIO INCA",
      virreinato: "VIRREINATO",
      emancipacion: "EMANCIPACIÓN",
      republica: "REPÚBLICA"
    };
    badge.textContent = titulos[_epocaSeleccionada] || _epocaSeleccionada.toUpperCase();
  }

  actualizarEstadoDropdownEpocas();
  renderizarNodosHistoria();

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

function renderizarNodosHistoria() {
  var container = document.getElementById("historiaNodesContainer");
  if (!container) return;
  container.innerHTML = "";

  var db = window.KICHAY_DATABASE || {};
  var niveles = db[_epocaSeleccionada] || [];

  var progresoStr = sessionStorage.getItem("kichay_progreso_historia") || "{}";
  var progreso = {};
  try { progreso = JSON.parse(progresoStr); } catch (err) {}

  var iconosEpoca = {
    preinca: ["🏺", "🏛️", "👑", "🔒", "🔒"],
    inca: ["☀️", "📜", "🌽", "🔒", "🔒"],
    virreinato: ["⛵", "⚖️", "🪙", "🔒", "🔒"],
    emancipacion: ["🗽", "🐎", "📜", "🔒", "🔒"],
    republica: ["🇵🇪", "🎖️", "⚔️", "🔒", "🔒"]
  };

  var posiciones = [
    "node-pos-1",
    "node-pos-2",
    "node-pos-3",
    "node-pos-4",
    "node-pos-5"
  ];

  var iconos = iconosEpoca[_epocaSeleccionada] || ["🏺", "🏛️", "👑", "🔒", "🔒"];

  // Determinar niveles desbloqueados secuencialmente
  niveles.forEach(function(item, idx) {
    var nodeDiv = document.createElement("div");
    var posClass = posiciones[idx] || ("node-pos-" + (idx + 1));
    
    // Nivel 1 siempre desbloqueado en la época actual; niveles posteriores requieren que el anterior esté completado
    var nivelAnteriorCompletado = (idx === 0) || !!progreso[_epocaSeleccionada + "_" + idx];
    var completado = !!progreso[_epocaSeleccionada + "_" + (idx + 1)];
    var desbloqueado = nivelAnteriorCompletado || (idx === 0);
    
    // El nivel activo es el primer desbloqueado no completado
    var activo = desbloqueado && !completado;

    var estadoClass = "unlocked";
    if (completado) estadoClass += " completed";
    if (activo)     estadoClass += " active";
    if (!desbloqueado) estadoClass = "locked";

    nodeDiv.className = "map-node " + posClass + " " + estadoClass;

    var estrellasTexto = "☆☆☆";
    if (completado) {
      var scoreEstrellas = progreso[_epocaSeleccionada + "_" + (idx + 1) + "_stars"] || 3;
      estrellasTexto = (scoreEstrellas === 3) ? "⭐⭐⭐" : (scoreEstrellas === 2 ? "⭐⭐☆" : "⭐☆☆");
    } else if (activo) {
      estrellasTexto = "Pendiente";
    }

    var iconChar = desbloqueado ? (iconos[idx] || "⭐") : "🔒";

    var htmlInner = '';
    if (activo) {
      htmlInner += '<div class="node-pulse-ring"></div>';
    }
    htmlInner += '<div class="node-disc"><span class="node-icon">' + iconChar + '</span></div>';
    if (activo) {
      htmlInner += '<div class="node-current-tag">¡JUGAR AHORA!</div>';
    } else {
      htmlInner += '<div class="node-stars">' + (desbloqueado ? estrellasTexto : "☆☆☆") + '</div>';
    }
    htmlInner += '<span class="node-label">Nivel ' + item.nivel + '</span>';

    nodeDiv.innerHTML = htmlInner;

    nodeDiv.addEventListener("click", function() {
      abrirModalNivel(
        item.nivel,
        item.titulo,
        "Dificultad: " + (item.dificultad || "Media") + ". ¡Responde las 5 preguntas del reto!",
        estrellasTexto,
        desbloqueado,
        item.intis || 30,
        item.exp || 50
      );
    });

    container.appendChild(nodeDiv);
  });
}

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
  
  cerrarModalNivel();

  if (window.QuizEngine && typeof window.QuizEngine.iniciarQuiz === "function") {
    window.QuizEngine.iniciarQuiz(_epocaSeleccionada, _nivelSeleccionado.numNivel);
  }
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
