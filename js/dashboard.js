/* ================================================================
   KICHAY - Dashboard Script
   Patron: import() dinamico de Firebase + fallback sessionStorage
================================================================ */

// ── Helpers UI ───────────────────────────────────────────────────
function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setAvatarPhoto(photoUrl, nombre) {
  var container = document.getElementById("topbarAvatarContainer");
  if (!container) return;
  
  if (photoUrl && photoUrl.trim() !== "") {
    container.innerHTML = '<img src="' + photoUrl + '" alt="' + (nombre || "Usuario") + '" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<span id=\\\'avatar-initial\\\'>' + (nombre ? nombre.charAt(0).toUpperCase() : 'U') + '</span>\'" />';
  } else {
    var initial = nombre ? nombre.charAt(0).toUpperCase() : 'U';
    container.innerHTML = '<span id="avatar-initial">' + initial + '</span>';
  }
}

// ── SISTEMA DE MISIONES DINÁMICAS Y CONSECUTIVAS ──────────────────
var LISTA_MISIONES = [
  {
    id: "mis_preinca_1",
    tag: "Misión 1: Preinca",
    titulo: "¡Primeros Pasos Ancestrales!",
    desc: "Completa el Nivel 1 de la época Preinca (Primeras civilizaciones).",
    recompensa: 30,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) { return !!progreso['preinca_1']; }
  },
  {
    id: "mis_preinca_2",
    tag: "Misión 2: Preinca",
    titulo: "El Misterio de Caral y Chavín",
    desc: "Supera el Nivel 2 de Preinca y gana tus estrellas.",
    recompensa: 40,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) { return !!progreso['preinca_2']; }
  },
  {
    id: "mis_preinca_all",
    tag: "Misión 3: Época Preinca",
    titulo: "¡Conquistador de la Época Preinca!",
    desc: "Supera los 5 niveles de Preinca para desbloquear el Imperio Inca.",
    recompensa: 60,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) { return !!progreso['preinca_5']; }
  },
  {
    id: "mis_inca_1",
    tag: "Misión 4: Imperio Inca",
    titulo: "Los Secretos del Tahuantinsuyo",
    desc: "Avanza y supera el Nivel 1 de la época Inca.",
    recompensa: 50,
    accion: function() { abrirVistaHistoria('inca'); },
    esCumplida: function(progreso) { return !!progreso['inca_1']; }
  },
  {
    id: "mis_sabio_3stars",
    tag: "Misión 5: Maestro del Saber",
    titulo: "Amauta Legendario",
    desc: "Consigue 3 estrellas doradas en al menos 3 lecciones distintas.",
    recompensa: 80,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) {
      var count = 0;
      for (var k in progreso) {
        if (k.endsWith("_stars") && progreso[k] >= 3) count++;
      }
      return count >= 3;
    }
  },
  {
    id: "mis_tesoro_200",
    tag: "Misión 6: Tesoro Andino",
    titulo: "Acumula 200 INTIS",
    desc: "Explora los niveles de historia y reúne 200 Intis en tu monedero.",
    recompensa: 100,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso, intis) { return intis >= 200; }
  }
];

window._misionActual = null;
window._misionEstado = "pendiente";

function actualizarBannerMisiones(datos) {
  var progreso = (datos && datos.progreso) ? datos.progreso : JSON.parse(sessionStorage.getItem("kichay_progreso") || "{}");
  var misionesReclamadas = (datos && datos.misionesReclamadas) ? datos.misionesReclamadas : JSON.parse(sessionStorage.getItem("kichay_misiones_reclamadas") || "{}");
  var intis = (datos && datos.intis !== undefined) ? datos.intis : parseInt(sessionStorage.getItem("kichay_intis") || "0", 10);

  // Buscar la primera misión no reclamada
  var misionEncontrada = null;
  for (var i = 0; i < LISTA_MISIONES.length; i++) {
    var m = LISTA_MISIONES[i];
    if (!misionesReclamadas[m.id]) {
      misionEncontrada = m;
      break;
    }
  }

  var tagEl   = document.getElementById("missionBannerTag");
  var titleEl = document.getElementById("missionBannerTitle");
  var subEl   = document.getElementById("missionBannerSub");
  var btnEl   = document.getElementById("btnMissionAction");
  var imgEl   = document.getElementById("missionBannerKusiImg");

  if (!tagEl || !titleEl || !subEl || !btnEl) return;

  if (!misionEncontrada) {
    tagEl.className = "mission-tag completed";
    tagEl.textContent = "¡TODAS LAS MISIONES COMPLETADAS! 🏆";
    titleEl.textContent = "¡Eres un Gran Maestro del Perú!";
    subEl.textContent = "Has completado todos los retos activos. ¡Pronto habrá nuevas misiones disponibles!";
    btnEl.className = "btn-comenzar";
    btnEl.textContent = "Explorar Mapa 🗺️";
    btnEl.onclick = function() { abrirVistaHistoria('preinca'); };
    if (imgEl) imgEl.src = "IMG/feliz.png";
    return;
  }

  window._misionActual = misionEncontrada;
  var estaCumplida = misionEncontrada.esCumplida(progreso, intis);

  if (estaCumplida) {
    window._misionEstado = "cumplida";
    tagEl.className = "mission-tag completed";
    tagEl.textContent = "¡MISIÓN CUMPLIDA! 🎉";
    titleEl.textContent = misionEncontrada.titulo;
    subEl.textContent = "¡Has superado el reto! Reclama tu recompensa de +" + misionEncontrada.recompensa + " INTIS.";
    btnEl.className = "btn-comenzar btn-claim-reward";
    btnEl.innerHTML = "¡Reclamar +" + misionEncontrada.recompensa + " 🪙!";
    if (imgEl) imgEl.src = "IMG/feliz.png";
  } else {
    window._misionEstado = "pendiente";
    tagEl.className = "mission-tag";
    tagEl.textContent = misionEncontrada.tag;
    titleEl.textContent = misionEncontrada.titulo;
    subEl.textContent = misionEncontrada.desc + " · Recompensa: +" + misionEncontrada.recompensa + " INTIS 🪙";
    btnEl.className = "btn-comenzar";
    btnEl.innerHTML = "Comenzar ➔";
    if (imgEl) imgEl.src = "IMG/pregunta.png";
  }
}

window.ejecutarAccionMision = function() {
  if (!window._misionActual) {
    abrirVistaHistoria('preinca');
    return;
  }

  if (window._misionEstado === "cumplida") {
    var mision = window._misionActual;
    var intisActuales = parseInt(sessionStorage.getItem("kichay_intis") || "0", 10);
    var nuevosIntis = intisActuales + mision.recompensa;
    sessionStorage.setItem("kichay_intis", nuevosIntis);
    setEl("hud-intis", nuevosIntis);

    var misionesReclamadas = JSON.parse(sessionStorage.getItem("kichay_misiones_reclamadas") || "{}");
    misionesReclamadas[mision.id] = true;
    sessionStorage.setItem("kichay_misiones_reclamadas", JSON.stringify(misionesReclamadas));
    localStorage.setItem("kichay_misiones_reclamadas", JSON.stringify(misionesReclamadas));
    localStorage.setItem("kichay_intis", String(nuevosIntis));

    var uid = sessionStorage.getItem("kichay_uid") || (window._firebaseAuth && window._firebaseAuth.currentUser && window._firebaseAuth.currentUser.uid);
    if (window._firebaseMod && uid && window._firebaseMod.guardarProgresoUsuario) {
      window._firebaseMod.guardarProgresoUsuario(uid, {
        intis: nuevosIntis,
        misionesReclamadas: misionesReclamadas
      }).then(function() {
        console.log("[KICHAY] ¡Recompensa de misión guardada permanentemente en Firestore!");
      }).catch(function(e) {
        console.warn("[KICHAY] Error guardando recompensa en Firestore:", e);
      });
    }

    if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
      window.KichaySound.playChime();
    }

    var tagEl   = document.getElementById("missionBannerTag");
    var titleEl = document.getElementById("missionBannerTitle");
    var subEl   = document.getElementById("missionBannerSub");
    var btnEl   = document.getElementById("btnMissionAction");

    if (tagEl) tagEl.textContent = "¡RECOMPENSA RECLAMADA! ✨";
    if (titleEl) titleEl.textContent = "¡+" + mision.recompensa + " INTIS agregados a tu monedero!";
    if (subEl) subEl.textContent = "Cargando tu siguiente misión...";
    if (btnEl) {
      btnEl.className = "btn-comenzar";
      btnEl.textContent = "¡Genial! 🥳";
    }

    setTimeout(function() {
      actualizarBannerMisiones({
        progreso: JSON.parse(sessionStorage.getItem("kichay_progreso") || "{}"),
        misionesReclamadas: misionesReclamadas,
        intis: nuevosIntis
      });
    }, 1800);

  } else {
    if (window._misionActual.accion) {
      window._misionActual.accion();
    } else {
      abrirVistaHistoria('preinca');
    }
  }
};

// ── Sistema de Experiencia Progresiva y Niveles de Kusi ───────────
window.calcularNivelKusi = function(expTotal) {
  var exp = parseInt(expTotal, 10) || 0;
  // Umbrales progresivos para exigir avance en todas las materias y niveles
  var umbrales = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500];
  var nivel = 1;
  for (var i = 1; i < umbrales.length; i++) {
    if (exp >= umbrales[i]) {
      nivel = i + 1;
    } else {
      break;
    }
  }
  var baseExp = umbrales[nivel - 1] || 0;
  var nextExp = umbrales[nivel] || (baseExp + 1000);
  var pct = Math.min(100, Math.max(0, Math.round(((exp - baseExp) / (nextExp - baseExp)) * 100)));
  return {
    nivel: nivel,
    expActual: exp,
    baseExp: baseExp,
    nextExp: nextExp,
    pct: pct
  };
};

// ── Cálculo del porcentaje global de Historia (25 niveles = 100%) ─
window.calcularProgresoHistoria = function(progMap) {
  if (!progMap || typeof progMap !== "object") return 0;
  var epocas = ["preinca", "inca", "virreinato", "emancipacion", "republica"];
  var completados = 0;
  epocas.forEach(function(ep) {
    for (var n = 1; n <= 5; n++) {
      if (progMap[ep + "_" + n] === true) {
        completados++;
      }
    }
  });
  // 25 formularios/niveles en total (5 épocas × 5 niveles)
  // Cada formulario completado suma exactamente 4% (25 × 4% = 100%)
  return Math.min(100, completados * 4);
};

function poblarDashboard(datos, racha) {
  var nombre = datos.nombre || sessionStorage.getItem("kichay_user") || "Explorador";
  var photo  = datos.photoURL || datos.foto || sessionStorage.getItem("kichay_photo") || "";
  
  setEl("nombre-usuario",   nombre);
  setEl("topbar-user-name", nombre);
  setAvatarPhoto(photo, nombre);

  setEl("hud-racha",        racha !== undefined ? racha : (datos.racha || 0));
  setEl("hud-intis",        datos.intis !== undefined ? datos.intis : 0);

  var exp = parseInt(datos.expKusi !== undefined ? datos.expKusi : (datos.experiencia || 0), 10);
  var infoNivel = window.calcularNivelKusi(exp);

  setEl("kusi-level-text", "Nivel " + infoNivel.nivel);
  setEl("kusi-exp-pct",    infoNivel.pct + "%");
  var kusiBar = document.querySelector(".kusi-bar-fill");
  if (kusiBar) kusiBar.style.width = infoNivel.pct + "%";

  // Progreso materias: 25 niveles totales en Historia = 4% por nivel (100% al completar todas las épocas)
  var progMap = datos.progresoHistoria || datos.progreso || {};
  var pctHistoria = window.calcularProgresoHistoria(progMap);

  var materias = [
    { key: "historia",    pct: pctHistoria },
    { key: "fauna",       pct: progMap.fauna || 0 },
    { key: "gastronomia", pct: progMap.gastronomia || 0 },
    { key: "cultura",     pct: progMap.cultura || 0 },
    { key: "turismo",     pct: progMap.turismo || 0 }
  ];

  materias.forEach(function(item) {
    var card = document.querySelector("[data-materia='" + item.key + "']");
    if (!card) return;
    var fill = card.querySelector(".card-progress-fill");
    var pctEl= card.querySelector(".card-pct");
    if (fill) fill.style.width = item.pct + "%";
    if (pctEl) pctEl.textContent = item.pct + "%";
  });

  actualizarBannerMisiones(datos);
}

// ── Fallback: mostrar datos de sessionStorage mientras carga ─────
(function fallbackImmediate() {
  var nombre = sessionStorage.getItem("kichay_user") || "Explorador";
  var photo  = sessionStorage.getItem("kichay_photo") || "";
  var racha  = sessionStorage.getItem("kichay_racha") || "0";
  var intis  = sessionStorage.getItem("kichay_intis") || "0";
  var progStr= sessionStorage.getItem("kichay_progreso_historia") || "{}";
  var progMap= {};
  try { progMap = JSON.parse(progStr); } catch(e){}

  var pctHist = window.calcularProgresoHistoria(progMap);
  var histFill = document.querySelector("[data-materia='historia'] .card-progress-fill");
  var histPct  = document.querySelector("[data-materia='historia'] .card-pct");
  if (histFill) histFill.style.width = pctHist + "%";
  if (histPct) histPct.textContent = pctHist + "%";

  setEl("nombre-usuario",   nombre);
  setEl("topbar-user-name", nombre);
  setAvatarPhoto(photo, nombre);
  setEl("hud-racha",  racha);
  setEl("hud-intis",  intis);

  var exp = parseInt(sessionStorage.getItem("kichay_exp") || "0", 10);
  var infoNivel = window.calcularNivelKusi(exp);
  setEl("kusi-level-text", "Nivel " + infoNivel.nivel);
  setEl("kusi-exp-pct",    infoNivel.pct + "%");
  var kusiBar = document.querySelector(".kusi-bar-fill");
  if (kusiBar) kusiBar.style.width = infoNivel.pct + "%";

  actualizarBannerMisiones({
    progreso: progMap,
    misionesReclamadas: JSON.parse(sessionStorage.getItem("kichay_misiones_reclamadas") || "{}"),
    intis: parseInt(intis, 10)
  });
})();

// ── Cargar Firebase y datos reales de Firestore ──────────────────
var firebaseUrl = new URL("./firebase.js", document.currentScript
  ? document.currentScript.src
  : location.href).href;

import(firebaseUrl).then(function(mod) {

  // Escuchar estado de autenticacion
  mod.onAuthStateChanged(mod.auth, function(fbUser) {
    var storedUid   = sessionStorage.getItem("kichay_uid");
    var storedEmail = sessionStorage.getItem("kichay_email");
    var activeUid   = fbUser ? fbUser.uid : storedUid;
    var activeEmail = fbUser ? (fbUser.email || storedEmail) : storedEmail;

    if (!activeUid) {
      if (!sessionStorage.getItem("kichay_perfil_completo")) {
        window.location.replace("index.html");
      }
      return;
    }

    window._firebaseMod = mod;
    window._firebaseAuth = mod.auth;

    // Cargar datos de Firestore buscando por UID y Email
    mod.obtenerUsuario(activeUid, activeEmail).then(function(datos) {
      if (!datos) return;

      var progMap = datos.progresoHistoria || datos.progreso || {};
      sessionStorage.setItem("kichay_uid",               fbUser.uid);
      sessionStorage.setItem("kichay_user",              datos.nombre || fbUser.displayName || "Explorador");
      sessionStorage.setItem("kichay_photo",             datos.photoURL || fbUser.photoURL || "");
      sessionStorage.setItem("kichay_intis",             datos.intis !== undefined ? datos.intis : 0);
      sessionStorage.setItem("kichay_exp",               datos.experiencia || datos.expKusi || 0);
      sessionStorage.setItem("kichay_kusi_nivel",        datos.kusiNivel || datos.nivelKusi || 1);
      sessionStorage.setItem("kichay_progreso_historia", JSON.stringify(progMap));
      sessionStorage.setItem("kichay_progreso",          JSON.stringify(progMap));
      sessionStorage.setItem("kichay_misiones_reclamadas", JSON.stringify(datos.misionesReclamadas || {}));
      sessionStorage.setItem("kichay_perfil_completo",   "1");

      if (progMap.preinca_5)     sessionStorage.setItem("unlocked_inca", "true");
      if (progMap.inca_5)        sessionStorage.setItem("unlocked_virreinato", "true");
      if (progMap.virreinato_5)  sessionStorage.setItem("unlocked_emancipacion", "true");
      if (progMap.emancipacion_5)sessionStorage.setItem("unlocked_republica", "true");

      // Actualizar racha diaria
      mod.actualizarAcceso(fbUser.uid, datos.racha || 0, datos.ultimoAcceso || null)
        .then(function(nuevaRacha) {
          sessionStorage.setItem("kichay_racha", nuevaRacha);
          poblarDashboard(datos, nuevaRacha);
          if (window.renderizarNodosHistoria) window.renderizarNodosHistoria();
          if (window.actualizarEstadoDropdownEpocas) window.actualizarEstadoDropdownEpocas();
        }).catch(function() {
          poblarDashboard(datos, datos.racha || 1);
          if (window.renderizarNodosHistoria) window.renderizarNodosHistoria();
          if (window.actualizarEstadoDropdownEpocas) window.actualizarEstadoDropdownEpocas();
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
  var todasVistas = document.querySelectorAll(".main-wrap .content");
  todasVistas.forEach(function(v) { v.style.display = "none"; });

  var viewInicio   = document.getElementById("view-inicio");
  var navInicio    = document.getElementById("nav-inicio");

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

window.abrirSeccionVisual = function(seccionKey, titulo) {
  // Ocultar todas las vistas principales
  var todasVistas = document.querySelectorAll(".main-wrap .content");
  todasVistas.forEach(function(v) { v.style.display = "none"; });

  // Desmarcar todos los nav-items
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(function(el) {
    el.classList.remove("active");
  });

  // Activar nav-item correspondiente
  var navItem = document.getElementById("nav-" + seccionKey);
  if (navItem) navItem.classList.add("active");

  // Mostrar vista correspondiente
  var targetViewId = "view-" + seccionKey;
  var targetView = document.getElementById(targetViewId);

  // Si es una materia extra (fauna, gastronomia, cultura, turismo)
  var materiasExtra = {
    fauna: { tag: "🌿 BIODIVERSIDAD PERUANA", title: "Flora y Fauna del Perú", desc: "Descubre los ecosistemas más asombrosos del Perú: Costa, Andes y Amazonía." },
    gastronomia: { tag: "🍲 SABORES ANCESTRALES", title: "Gastronomía Peruana", desc: "Aprende los secretos y sabores de los platos bandera de cada región." },
    cultura: { tag: "🎭 TRADICIONES Y DANZAS", title: "Cultura y Cosmovisión", desc: "Conoce las tradiciones, danzas, festividades y cosmovisión andina." },
    turismo: { tag: "🧭 MARAVILLAS DEL PERÚ", title: "Turismo y Destinos", desc: "Viaja por los destinos y maravillas turísticas más increíbles del país." }
  };

  if (materiasExtra[seccionKey]) {
    targetView = document.getElementById("view-materia-extra");
    var mInfo = materiasExtra[seccionKey];
    var tagEl = document.getElementById("materiaExtraTag");
    var titEl = document.getElementById("materiaExtraTitle");
    var descEl = document.getElementById("materiaExtraDesc");
    if (tagEl) tagEl.textContent = mInfo.tag;
    if (titEl) titEl.textContent = mInfo.title;
    if (descEl) descEl.textContent = mInfo.desc;
  }

  // Hidratar perfil si es 'perfil'
  if (seccionKey === "perfil") {
    var nombre = sessionStorage.getItem("kichay_user") || "Explorador";
    var photo  = sessionStorage.getItem("kichay_photo") || "";
    var email  = sessionStorage.getItem("kichay_email") || "explorador@kichay.pe";
    var nomEl  = document.getElementById("perfilNombreView");
    var emEl   = document.getElementById("perfilEmailView");
    var avEl   = document.getElementById("perfilAvatarView");
    if (nomEl) nomEl.textContent = nombre;
    if (emEl) emEl.textContent = email;
    if (avEl) {
      if (photo) {
        avEl.innerHTML = '<img src="' + photo + '" alt="' + nombre + '" referrerpolicy="no-referrer" />';
      } else {
        avEl.innerHTML = '<span>' + nombre.charAt(0).toUpperCase() + '</span>';
      }
    }
  }

  if (targetView) {
    targetView.style.display = "flex";
    targetView.scrollTop = 0;
  }

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }

  // Mostrar la ventana emergente informativa requerida
  mostrarModalVisualizacion(titulo || seccionKey);
};

window.mostrarModalVisualizacion = function(nombreSeccion) {
  var modal = document.getElementById("modalSoloVisualizacion");
  var tagEl = document.getElementById("modalVisualTag");
  var titEl = document.getElementById("modalVisualTitulo");
  var msgEl = document.getElementById("modalVisualMensaje");

  if (tagEl) tagEl.textContent = "✨ MODO VISTA PREVIA";
  if (titEl) titEl.textContent = (nombreSeccion ? ("¡" + nombreSeccion + "! 🌟") : "¡Sección en Vista Previa! 🌟");
  if (msgEl) msgEl.textContent = "por ahora solo visualizacion, futuras acciones en las proximas actualizaciones";

  if (modal) modal.style.display = "flex";

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }
};

window.cerrarModalVisualizacion = function(e) {
  if (e && e.target && e.target.id !== "modalSoloVisualizacion" && !e.target.classList.contains("modal-btn-confirm")) return;
  var modal = document.getElementById("modalSoloVisualizacion");
  if (modal) modal.style.display = "none";
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
    
    window.mostrarModalBloqueado(
      "🔒 CAPÍTULO BLOQUEADO",
      "¡Época Bloqueada! 🏛️",
      "Para desbloquear este capítulo de Historia, primero debes completar los 5 niveles del cuestionario de " + (nombresPrevios[epocaKey] || "la época anterior") + "."
    );
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

  var numerosRomanos = ["I", "II", "III", "IV", "V"];

  var posiciones = [
    "node-pos-1",
    "node-pos-2",
    "node-pos-3",
    "node-pos-4",
    "node-pos-5"
  ];

  // Determinar niveles desbloqueados secuencialmente
  niveles.forEach(function(item, idx) {
    var nodeDiv = document.createElement("div");
    var posClass = posiciones[idx] || ("node-pos-" + (idx + 1));
    var romanChar = numerosRomanos[idx] || (idx + 1);
    
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

    var iconChar = desbloqueado ? romanChar : "🔒";

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
    htmlInner += '<span class="node-label">Nivel ' + romanChar + '</span>';

    nodeDiv.innerHTML = htmlInner;

    nodeDiv.addEventListener("click", function() {
      if (!desbloqueado) {
        window.mostrarModalBloqueado(
          "🔒 NIVEL BLOQUEADO",
          "¡Nivel " + romanChar + " Bloqueado! 🛡️",
          "Para jugar este nivel, primero debes completar con éxito el Nivel " + (numerosRomanos[idx - 1] || idx) + "."
        );
        return;
      }
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
// MODAL: NIVEL / ÉPOCA BLOQUEADA (POPUP CENTRAL)
// ══════════════════════════════════════════════════════════════
window.mostrarModalBloqueado = function(tag, titulo, mensaje) {
  var modal = document.getElementById("modalBloqueado");
  var tagEl = document.getElementById("modalBloqueadoTag");
  var titEl = document.getElementById("modalBloqueadoTitulo");
  var msgEl = document.getElementById("modalBloqueadoMensaje");

  if (tagEl && tag)       tagEl.textContent = tag;
  if (titEl && titulo)    titEl.textContent = titulo;
  if (msgEl && mensaje)   msgEl.textContent = mensaje;

  if (modal) modal.style.display = "flex";

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }
};

window.cerrarModalBloqueado = function(e) {
  if (e && e.target && e.target.id !== "modalBloqueado" && !e.target.classList.contains("modal-btn-confirm")) return;
  var modal = document.getElementById("modalBloqueado");
  if (modal) modal.style.display = "none";
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
  var actual = parseInt(sessionStorage.getItem("kichay_intis") || "0", 10);
  var nuevo  = actual + _cofreValor;
  if (hudIntis) hudIntis.textContent = nuevo;
  sessionStorage.setItem("kichay_intis", nuevo);
  localStorage.setItem("kichay_intis", String(nuevo));

  var uid = sessionStorage.getItem("kichay_uid") || (window._firebaseAuth && window._firebaseAuth.currentUser && window._firebaseAuth.currentUser.uid);
  if (window._firebaseMod && uid && window._firebaseMod.guardarProgresoUsuario) {
    window._firebaseMod.guardarProgresoUsuario(uid, { intis: nuevo });
  }

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }

  cerrarModalCofre();
};
