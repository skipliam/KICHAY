/* ================================================================
   KICHAY - Dashboard Script
   Patron: import() dinamico de Firebase + fallback sessionStorage
================================================================ */

// ── Precarga inmediata en memoria para transiciones en 0 ms ────────
(function preloadKichayMapAssets() {
  ["IMG/camino_virreyinato.png", "IMG/camino_historia.png", "IMG/granja_mapa.png"].forEach(function(src) {
    var img = new Image();
    img.src = src;
  });
})();

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

// ── SISTEMA DE MISIONES DIARIAS EQUILIBRADAS DE KICHAY ────────────
var LISTA_MISIONES = [
  {
    id: "mis_facil_1",
    tag: "🟢 Misión Fácil",
    titulo: "Completa 1 lección",
    desc: "Supera al menos 1 nivel de cualquier época histórica.",
    recompensa: 20,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) {
      var count = 0;
      for (var k in progreso) {
        if (!k.endsWith("_stars") && !k.endsWith("_cofre") && !k.endsWith("_reclamado") && progreso[k] === true) count++;
      }
      return count >= 1;
    }
  },
  {
    id: "mis_media_2",
    tag: "🟡 Misión Media",
    titulo: "Responde 10 preguntas correctamente",
    desc: "Demuestra tus conocimientos ancestrales en 2 lecciones.",
    recompensa: 30,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) {
      var count = 0;
      for (var k in progreso) {
        if (!k.endsWith("_stars") && !k.endsWith("_cofre") && !k.endsWith("_reclamado") && progreso[k] === true) count++;
      }
      return count >= 2;
    }
  },
  {
    id: "mis_dificil_3",
    tag: "🔴 Misión Difícil",
    titulo: "Completa 2 lecciones con éxito",
    desc: "Avanza en el mapa y supera 2 retos históricos.",
    recompensa: 50,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) {
      var count = 0;
      for (var k in progreso) {
        if (!k.endsWith("_stars") && !k.endsWith("_cofre") && !k.endsWith("_reclamado") && progreso[k] === true) count++;
      }
      return count >= 3;
    }
  },
  {
    id: "mis_bonus_diario",
    tag: "🎁 Gran Bonus Diario",
    titulo: "¡Trilogía Diaria Cumplida!",
    desc: "Completaste las 3 misiones del día. Reclama tu recompensa especial.",
    recompensa: 20,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso, intis, misionesReclamadas) {
      return !!(misionesReclamadas && misionesReclamadas["mis_facil_1"] && misionesReclamadas["mis_media_2"] && misionesReclamadas["mis_dificil_3"]);
    }
  },
  {
    id: "mis_sabio_amauta",
    tag: "🏆 Misión Maestra",
    titulo: "Amauta Legendario (3 ⭐)",
    desc: "Consigue 3 estrellas doradas en al menos 3 lecciones distintas.",
    recompensa: 40,
    accion: function() { abrirVistaHistoria('preinca'); },
    esCumplida: function(progreso) {
      var count = 0;
      for (var k in progreso) {
        if (k.endsWith("_stars") && progreso[k] >= 3) count++;
      }
      return count >= 3;
    }
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

function aplicarDatosUsuario(datos, rachaParam) {
  if (!datos) return;
  var progMap = datos.progresoHistoria || datos.progreso || {};
  
  if (datos.uid) sessionStorage.setItem("kichay_uid", datos.uid);
  if (datos.nombre) sessionStorage.setItem("kichay_user", datos.nombre);
  if (datos.photoURL || datos.foto) sessionStorage.setItem("kichay_photo", datos.photoURL || datos.foto);
  if (datos.intis !== undefined) sessionStorage.setItem("kichay_intis", datos.intis);
  if (datos.experiencia !== undefined || datos.expKusi !== undefined) {
    sessionStorage.setItem("kichay_exp", datos.experiencia !== undefined ? datos.experiencia : datos.expKusi);
  }
  if (datos.kusiNivel !== undefined || datos.nivelKusi !== undefined) {
    sessionStorage.setItem("kichay_kusi_nivel", datos.kusiNivel || datos.nivelKusi);
  }
  sessionStorage.setItem("kichay_progreso_historia", JSON.stringify(progMap));
  sessionStorage.setItem("kichay_progreso", JSON.stringify(progMap));
  sessionStorage.setItem("kichay_misiones_reclamadas", JSON.stringify(datos.misionesReclamadas || {}));
  sessionStorage.setItem("kichay_perfil_completo", "1");

  if (progMap.preinca_5) sessionStorage.setItem("unlocked_inca", "true");
  if (progMap.inca_5) sessionStorage.setItem("unlocked_virreinato", "true");
  if (progMap.virreinato_5) sessionStorage.setItem("unlocked_emancipacion", "true");
  if (progMap.emancipacion_5) sessionStorage.setItem("unlocked_republica", "true");

  var racha = rachaParam !== undefined ? rachaParam : (datos.racha || parseInt(sessionStorage.getItem("kichay_racha") || "1", 10));
  sessionStorage.setItem("kichay_racha", racha);

  poblarDashboard(datos, racha);
  if (window.renderizarNodosHistoria) window.renderizarNodosHistoria();
  if (window.actualizarEstadoDropdownEpocas) window.actualizarEstadoDropdownEpocas();
  if (window.cargarRankingEnVivo) window.cargarRankingEnVivo();
}

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

    // 1. Cargar datos iniciales y sincronizar racha
    mod.obtenerUsuario(activeUid, activeEmail).then(function(datos) {
      if (!datos) return;
      mod.actualizarAcceso(activeUid, datos.racha || 0, datos.ultimoAcceso || null)
        .then(function(nuevaRacha) {
          aplicarDatosUsuario(datos, nuevaRacha);
        }).catch(function() {
          aplicarDatosUsuario(datos, datos.racha || 1);
        });
    }).catch(function(err) {
      console.warn("[KICHAY] Error Firestore, usando sessionStorage:", err);
    });

    // 2. SINCRONIZACIÓN EN TIEMPO REAL (onSnapshot): Refleja cambios entre PC, Laptop y Celular al instante
    if (typeof mod.escucharUsuarioEnVivo === "function") {
      mod.escucharUsuarioEnVivo(activeUid, function(datosEnVivo) {
        if (datosEnVivo) {
          aplicarDatosUsuario(datosEnVivo);
        }
      });
    }

    // 3. Re-sincronizar al volver a la pestaña o desbloquear celular
    function resincronizarAlFoco() {
      if (document.visibilityState === "visible") {
        mod.obtenerUsuario(activeUid, activeEmail).then(function(datosFrescos) {
          if (datosFrescos) aplicarDatosUsuario(datosFrescos);
        }).catch(function() {});
      }
    }
    document.addEventListener("visibilitychange", resincronizarAlFoco);
    window.addEventListener("focus", resincronizarAlFoco);
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
    toggleMobileSidebar(false);
  });
});

// ══════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE VISTAS (Inicio / Historia / Quiz / Subvistas)
// ══════════════════════════════════════════════════════════════
var _epocaSeleccionada = "preinca";

function ocultarTodasLasVistas() {
  var vistas = document.querySelectorAll(".main-wrap > main, .main-wrap .content");
  vistas.forEach(function(v) {
    v.style.display = "none";
  });
}

window.abrirVistaHistoria = function(epocaOpcional) {
  ocultarTodasLasVistas();

  var viewHistoria = document.getElementById("view-historia");
  var navHistoria  = document.getElementById("nav-historia");

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
  ocultarTodasLasVistas();

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
  // Ocultar estrictamente todas las vistas
  ocultarTodasLasVistas();

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

  // Si es Ranking, cargar datos frescos de Firestore y actualizar podio
  if (seccionKey === "ranking") {
    window.cargarRankingEnVivo();
  }

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

  if (seccionKey === "granja") {
    setTimeout(function() {
      var container = document.querySelector(".granja-map-container");
      var viewport = document.getElementById("granjaMapViewport");
      if (container && viewport && viewport.scrollWidth > container.clientWidth) {
        container.scrollLeft = (viewport.scrollWidth - container.clientWidth) / 2;
      }
    }, 60);
  }

  if (targetView) {
    targetView.style.display = "flex";
    targetView.scrollTop = 0;
  }

  if (window.KichaySound && typeof window.KichaySound.playSoftClick === "function") {
    window.KichaySound.playSoftClick();
  }

  // Mostrar modal de vista previa en secciones en construcción (excepto ranking y perfil)
  if (seccionKey !== "ranking" && seccionKey !== "perfil") {
    mostrarModalVisualizacion(titulo || seccionKey);
  }
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
// SECCIÓN RANKING: CARGA EN TIEMPO REAL DESDE FIRESTORE (1 MIN)
// ══════════════════════════════════════════════════════════════
window.cargarRankingEnVivo = function() {
  var container = document.getElementById("rankingListContainer");
  if (!container) return;

  var currentUid = sessionStorage.getItem("kichay_uid") || "";
  var currentUser = sessionStorage.getItem("kichay_user") || "Tú";
  var currentExp = parseInt(sessionStorage.getItem("kichay_exp") || "0", 10);
  var currentLevelInfo = window.calcularNivelKusi ? window.calcularNivelKusi(currentExp) : { nivel: 1 };
  var currentRacha = parseInt(sessionStorage.getItem("kichay_racha") || "0", 10);
  var currentPhoto = sessionStorage.getItem("kichay_photo") || "";

  var fetchPromise = (window._firebaseMod && typeof window._firebaseMod.obtenerRankingUsuarios === "function")
    ? window._firebaseMod.obtenerRankingUsuarios()
    : Promise.resolve([]);

  fetchPromise.then(function(usuariosDB) {
    var listaCompleta = (usuariosDB && usuariosDB.length > 0) ? usuariosDB.slice() : [];

    // Asegurar que el usuario actual esté presente con sus datos más frescos
    var existeActual = false;
    for (var i = 0; i < listaCompleta.length; i++) {
      if (listaCompleta[i].uid === currentUid || (currentUid && listaCompleta[i].nombre === currentUser)) {
        listaCompleta[i].nombre = currentUser;
        listaCompleta[i].experiencia = currentExp;
        listaCompleta[i].nivel = currentLevelInfo.nivel;
        listaCompleta[i].racha = currentRacha;
        listaCompleta[i].photoURL = currentPhoto || listaCompleta[i].photoURL;
        existeActual = true;
        break;
      }
    }
    if (!existeActual && currentUser) {
      listaCompleta.push({
        uid: currentUid || "temp_user",
        nombre: currentUser,
        photoURL: currentPhoto,
        experiencia: currentExp,
        nivel: currentLevelInfo.nivel,
        racha: currentRacha,
        intis: parseInt(sessionStorage.getItem("kichay_intis") || "0", 10),
        isCurrent: true
      });
    }

    // Guardianes de ejemplo si la base de datos es nueva para que el ranking siempre sea emocionante
    if (listaCompleta.length < 5) {
      var guardianesExtra = [
        { uid: "g1", nombre: "Amauta Yupanqui", photoURL: "", experiencia: 1850, nivel: 5, racha: 12, intis: 340 },
        { uid: "g2", nombre: "Chasca de los Andes", photoURL: "", experiencia: 1200, nivel: 4, racha: 8, intis: 220 },
        { uid: "g3", nombre: "Inti Raymi", photoURL: "", experiencia: 850, nivel: 3, racha: 5, intis: 160 },
        { uid: "g4", nombre: "Sayri Tupac", photoURL: "", experiencia: 450, nivel: 2, racha: 4, intis: 90 },
        { uid: "g5", nombre: "Urpi Sabia", photoURL: "", experiencia: 150, nivel: 1, racha: 2, intis: 40 }
      ];
      guardianesExtra.forEach(function(g) {
        if (!listaCompleta.some(function(u){ return u.nombre === g.nombre; })) {
          listaCompleta.push(g);
        }
      });
    }

    // Reordenar por nivel y experiencia descendente
    listaCompleta.sort(function(a, b) {
      var nA = parseInt(a.nivel || 1, 10);
      var nB = parseInt(b.nivel || 1, 10);
      if (nB !== nA) return nB - nA;
      return parseInt(b.experiencia || 0, 10) - parseInt(a.experiencia || 0, 10);
    });

    // Actualizar Podio (Top 1, 2, 3)
    renderizarPodio(listaCompleta.slice(0, 3));

    // Renderizar Tabla
    renderizarTablaRanking(listaCompleta, currentUid, currentUser);
  }).catch(function(e) {
    console.warn("[KICHAY Ranking] Error:", e);
  });
};

function renderizarPodio(top3) {
  // Top 1
  if (top3[0]) {
    var p1 = top3[0];
    setEl("podiumName1", p1.nombre);
    setEl("podiumLevel1", "Nivel " + (p1.nivel || 1));
    setEl("podiumExp1", (p1.experiencia || 0) + " EXP");
    var av1 = document.getElementById("podiumAvatar1");
    if (av1) {
      if (p1.photoURL) {
        av1.innerHTML = '<img src="' + p1.photoURL + '" alt="' + p1.nombre + '" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />';
      } else {
        av1.textContent = p1.nombre.charAt(0).toUpperCase();
      }
    }
  }

  // Top 2
  if (top3[1]) {
    var p2 = top3[1];
    setEl("podiumName2", p2.nombre);
    setEl("podiumLevel2", "Nivel " + (p2.nivel || 1));
    setEl("podiumExp2", (p2.experiencia || 0) + " EXP");
    var av2 = document.getElementById("podiumAvatar2");
    if (av2) {
      if (p2.photoURL) {
        av2.innerHTML = '<img src="' + p2.photoURL + '" alt="' + p2.nombre + '" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />';
      } else {
        av2.textContent = p2.nombre.charAt(0).toUpperCase();
      }
    }
  }

  // Top 3
  if (top3[2]) {
    var p3 = top3[2];
    setEl("podiumName3", p3.nombre);
    setEl("podiumLevel3", "Nivel " + (p3.nivel || 1));
    setEl("podiumExp3", (p3.experiencia || 0) + " EXP");
    var av3 = document.getElementById("podiumAvatar3");
    if (av3) {
      if (p3.photoURL) {
        av3.innerHTML = '<img src="' + p3.photoURL + '" alt="' + p3.nombre + '" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />';
      } else {
        av3.textContent = p3.nombre.charAt(0).toUpperCase();
      }
    }
  }
}

function renderizarTablaRanking(lista, currentUid, currentNombre) {
  var container = document.getElementById("rankingListContainer");
  if (!container) return;
  container.innerHTML = "";

  var rangosAndinos = [
    "Iniciado de los Andes",
    "Explorador Valiente",
    "Guardián del Sol",
    "Sabio del Tahuantinsuyo",
    "Gran Amauta Imperial"
  ];

  lista.forEach(function(usr, index) {
    var puesto = index + 1;
    var esActual = (usr.uid === currentUid) || (usr.isCurrent) || (usr.nombre === currentNombre && currentNombre !== "Explorador");
    var row = document.createElement("div");
    row.className = "ranking-row" + (esActual ? " current-user-row" : "");

    var posClass = (puesto === 1) ? "rank-pos-1" : ((puesto === 2) ? "rank-pos-2" : ((puesto === 3) ? "rank-pos-3" : ""));
    var posBadge = '<div class="rank-pos-badge ' + posClass + '">' + (puesto === 1 ? '🥇' : (puesto === 2 ? '🥈' : (puesto === 3 ? '🥉' : ('#' + puesto)))) + '</div>';

    var avHtml = usr.photoURL
      ? '<img src="' + usr.photoURL + '" class="rank-avatar" alt="' + usr.nombre + '" referrerpolicy="no-referrer" />'
      : '<div class="rank-avatar">' + (usr.nombre ? usr.nombre.charAt(0).toUpperCase() : "E") + '</div>';

    var rangoTexto = rangosAndinos[Math.min(rangosAndinos.length - 1, Math.max(0, (usr.nivel || 1) - 1))];

    row.innerHTML = 
      posBadge +
      '<div class="rank-user-info">' +
        avHtml +
        '<div class="rank-name-wrap">' +
          '<span class="rank-name">' + (usr.nombre || "Explorador") + (esActual ? ' <strong style="color:#D35400; font-size:12px;">(Tú)</strong>' : '') + '</span>' +
          '<span class="rank-title-badge">' + rangoTexto + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="rank-level-col"><span>⚡ Nivel ' + (usr.nivel || 1) + '</span></div>' +
      '<div class="rank-exp-col">' + (usr.experiencia || 0) + ' EXP</div>' +
      '<div class="rank-streak-col">' + (usr.racha || 0) + ' días 🔥</div>';

    container.appendChild(row);
  });
}

// Iniciar actualización periódica de Ranking cada 1 minuto (60,000 ms)
setInterval(function() {
  var rankingView = document.getElementById("view-ranking");
  if (rankingView && rankingView.style.display !== "none") {
    window.cargarRankingEnVivo();
  }
}, 60000);

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

  // Activar clase para cambio visual instantáneo (0 ms)
  var mapViewport = document.getElementById("historiaMapViewport");
  if (mapViewport) {
    if (_epocaSeleccionada === "virreinato") {
      mapViewport.classList.add("epoca-virreinato");
    } else {
      mapViewport.classList.remove("epoca-virreinato");
    }
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

  // Actualizar estado del Cofre de Recompensa según la época actual
  var chestNode = document.getElementById("mapChestNode");
  var chestBubble = document.getElementById("mapChestBubble");
  var chestEmoji = document.getElementById("mapChestEmoji");
  var chestAmount = document.getElementById("mapChestAmount");

  if (chestNode && chestBubble) {
    var nivel3Completado = !!progreso[_epocaSeleccionada + "_3"];
    var cofreYaReclamado = !!(progreso[_epocaSeleccionada + "_cofre_reclamado"] || progreso[_epocaSeleccionada + "_cofre"]);

    var valorCofre = 30;
    var nombreCofre = "Cofre de Tierra (Preinca)";
    if (_epocaSeleccionada === "inca") {
      valorCofre = 50;
      nombreCofre = "Cofre de Naturaleza (Inca)";
    } else if (_epocaSeleccionada === "virreinato" || _epocaSeleccionada === "emancipacion") {
      valorCofre = 75;
      nombreCofre = "Cofre de Explorador (" + _epocaSeleccionada.toUpperCase() + ")";
    } else if (_epocaSeleccionada === "republica") {
      valorCofre = 100;
      nombreCofre = "Cofre del Inti (República)";
    }

    chestBubble.classList.remove("locked", "unlocked", "claimed", "pulse-chest");

    if (cofreYaReclamado) {
      chestBubble.classList.add("claimed");
      if (chestEmoji) chestEmoji.textContent = "✓";
      if (chestAmount) chestAmount.textContent = "RECLAMADO";
      chestNode.onclick = function() {
        window.mostrarModalBloqueado(
          "✓ COFRE YA RECLAMADO",
          "¡Recompensa ya reclamada! 🎁",
          "Ya has reclamado los +" + valorCofre + " INTIS de este " + nombreCofre + "."
        );
      };
    } else if (nivel3Completado) {
      chestBubble.classList.add("unlocked", "pulse-chest");
      if (chestEmoji) chestEmoji.textContent = "🎁";
      if (chestAmount) chestAmount.textContent = "+" + valorCofre + " INTIS";
      chestNode.onclick = function() {
        window.abrirModalCofre(valorCofre, nombreCofre);
      };
    } else {
      chestBubble.classList.add("locked");
      if (chestEmoji) chestEmoji.textContent = "🔒";
      if (chestAmount) chestAmount.textContent = "+" + valorCofre + " INTIS";
      chestNode.onclick = function() {
        window.mostrarModalBloqueado(
          "🔒 COFRE BLOQUEADO",
          "¡" + nombreCofre + " Bloqueado! 🎁",
          "Para desbloquear este cofre y obtener +" + valorCofre + " INTIS, primero debes completar el Nivel III de esta época."
        );
      };
    }
  }
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
  var progresoStr = sessionStorage.getItem("kichay_progreso_historia") || "{}";
  var progreso = {};
  try { progreso = JSON.parse(progresoStr); } catch (e) {}

  var cofreKey = _epocaSeleccionada + "_cofre_reclamado";
  if (progreso[cofreKey] || progreso[_epocaSeleccionada + "_cofre"]) {
    cerrarModalCofre();
    return;
  }

  // Marcar como reclamado permanentemente en la época actual
  progreso[cofreKey] = true;
  progreso[_epocaSeleccionada + "_cofre"] = true;
  sessionStorage.setItem("kichay_progreso_historia", JSON.stringify(progreso));
  sessionStorage.setItem("kichay_progreso", JSON.stringify(progreso));

  var hudIntis = document.getElementById("hud-intis");
  var actual = parseInt(sessionStorage.getItem("kichay_intis") || "0", 10);
  var nuevo  = actual + _cofreValor;
  if (hudIntis) hudIntis.textContent = nuevo;
  sessionStorage.setItem("kichay_intis", nuevo);
  localStorage.setItem("kichay_intis", String(nuevo));

  var uid = sessionStorage.getItem("kichay_uid") || (window._firebaseAuth && window._firebaseAuth.currentUser && window._firebaseAuth.currentUser.uid);
  if (window._firebaseMod && uid && window._firebaseMod.guardarProgresoUsuario) {
    window._firebaseMod.guardarProgresoUsuario(uid, {
      intis: nuevo,
      progresoHistoria: progreso,
      progreso: progreso
    });
  }

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }

  cerrarModalCofre();
  renderizarNodosHistoria();
};

// ══════════════════════════════════════════════════════════════
// GRANJA DEL SOL (ANDENES SAGRADOS INTERACTIVOS)
// ══════════════════════════════════════════════════════════════
window.abrirModalCultivo = function(tipo, nombre, ganancia, descripcion) {
  window.mostrarModalBloqueado(
    "🌱 CULTIVO EN ANDENES",
    "¡" + nombre + "! 🌾",
    descripcion + "<br><br><strong>Recompensa de Cosecha:</strong> +" + ganancia + " INTIS 🪙<br><span style='font-size:12px; color:#2E7D32;'>¡Usa el botón \"Cosechar todo\" para recolectar tus cultivos!</span>"
  );
};

window.cosecharTodoLaGranja = function() {
  var gananciaTotal = 35; // Cosecha balanceada disponible
  var hudIntis = document.getElementById("hud-intis");
  var actual = parseInt(sessionStorage.getItem("kichay_intis") || "50", 10);
  var nuevo  = actual + gananciaTotal;

  if (hudIntis) hudIntis.textContent = nuevo;
  sessionStorage.setItem("kichay_intis", nuevo);
  localStorage.setItem("kichay_intis", String(nuevo));

  var uid = sessionStorage.getItem("kichay_uid") || (window._firebaseAuth && window._firebaseAuth.currentUser && window._firebaseAuth.currentUser.uid);
  if (window._firebaseMod && uid && window._firebaseMod.guardarProgresoUsuario) {
    window._firebaseMod.guardarProgresoUsuario(uid, {
      intis: nuevo
    });
  }

  if (window.KichaySound && typeof window.KichaySound.playChime === "function") {
    window.KichaySound.playChime();
  }

  var btn = document.getElementById("btnCosecharTodo");
  if (btn) {
    btn.innerHTML = '<span class="btn-harvest-text">¡Cosechado! ✓</span><span class="btn-harvest-icon">✨</span>';
    btn.style.background = "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)";
    setTimeout(function() {
      if (btn) {
        btn.innerHTML = '<span class="btn-harvest-text">Cosechar todo</span><span class="btn-harvest-icon">🧺</span>';
        btn.style.background = "";
      }
    }, 4000);
  }

  window.mostrarModalBloqueado(
    "🌾 ¡COSECHA SAGRADA EXITOSA!",
    "¡Cosechaste los Andenes del Sol! 🧺",
    "Has recolectado tus cultivos ancestrales con éxito.<br><br><strong style='font-size:18px; color:#D9381E;'>+35 INTIS 🪙</strong> y <strong style='font-size:16px; color:#2E7D32;'>+3 GUANO 🌾</strong> añadidos a tu monedero."
  );
};

window.abrirTiendaSemillasGranja = function() {
  window.abrirSeccionVisual('tienda', 'Tienda del Sol');
};

window.abrirMejorasGranja = function() {
  window.mostrarModalProximamente(
    "Mejoras de Andenes y Riego",
    "Pronto podrás ampliar tus andenes incas, construir canales de riego por acequias y colocar espantapájaros protectores."
  );
};

window.abrirMisionesGranja = function() {
  window.mostrarModalProximamente(
    "Misiones Agrícolas",
    "Pronto podrás completar encargos de los Sabios Amautas para cultivar variedades específicas de papas nativas y maíz sagrado."
  );
};

