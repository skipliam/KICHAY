/* ================================================================
   KICHAY - Login Script v4 (Ultra-Resiliente)
   Soporta Firebase Auth nativo + Fallback directo con Google JWT
================================================================ */

// ── 1. Helper: Decodificar JWT de Google ─────────────────────────
function decodeJwtResponse(token) {
  try {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window.atob(base64).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("[KICHAY] No se pudo decodificar JWT:", e);
    return null;
  }
}

// ── 2. Cola de credenciales ───────────────────────────────────────
var _pendingCredential = null;
var _firebaseReady     = false;
var _procesarLogin     = null;

// ── 3. STUB GLOBAL — Google SDK lo llama al hacer clic ───────────
window.handleGoogleLogin = function(response) {
  if (_firebaseReady && _procesarLogin) {
    _procesarLogin(response.credential);
  } else {
    _pendingCredential = response.credential;
  }
};

// ── 4. Resolver URL de firebase.js ───────────────────────────────
var _scriptSrc = "";
var _scripts   = document.querySelectorAll('script[src*="login.js"]');
if (_scripts.length > 0) {
  _scriptSrc = _scripts[_scripts.length - 1].src;
}
var firebaseUrl = _scriptSrc
  ? new URL("./firebase.js", _scriptSrc).href
  : (location.origin + "/js/firebase.js");

// ── 5. Cargar Firebase con import() dinámico ─────────────────────
import(firebaseUrl).then(function(mod) {

  _firebaseReady = true;

  _procesarLogin = async function(credential) {
    var btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) {
      btnWrap.style.opacity       = "0.6";
      btnWrap.style.pointerEvents = "none";
    }

    // Decodificar los datos del perfil de Google de forma inmediata
    var googlePayload = decodeJwtResponse(credential);
    var googleUid     = googlePayload ? googlePayload.sub : null;
    var googleEmail   = googlePayload ? googlePayload.email : "";
    var googleNombre  = googlePayload ? (googlePayload.given_name || googlePayload.name || "Explorador") : "Explorador";
    var googlePhoto   = googlePayload ? (googlePayload.picture || "") : "";

    var uid    = googleUid || ("user_" + Date.now());
    var nombre = googleNombre;

    try {
      // Intentar autenticación con Firebase Auth
      var googleCred = mod.GoogleAuthProvider.credential(credential);
      var userCred   = await mod.signInWithCredential(mod.auth, googleCred);
      if (userCred && userCred.user) {
        uid    = userCred.user.uid;
        nombre = userCred.user.displayName || googleNombre;
      }
    } catch (authErr) {
      console.warn("[KICHAY] Firebase Auth aviso (usando identificador de Google directo):", authErr.code || authErr);
      // Continuamos con el identificador seguro de Google (sub)
    }

    sessionStorage.setItem("kichay_uid",  uid);
    sessionStorage.setItem("kichay_user", nombre);

    try {
      // Consultar o crear usuario en Firestore
      var datosFS = null;
      try {
        datosFS = await mod.obtenerUsuario(uid);
      } catch (fsGetErr) {
        console.warn("[KICHAY] Firestore read aviso:", fsGetErr);
      }

      if (!datosFS) {
        try {
          await mod.crearUsuario(uid, {
            email:    googleEmail,
            nombre:   nombre,
            photoURL: googlePhoto
          });
          datosFS = await mod.obtenerUsuario(uid);
        } catch (fsCreateErr) {
          console.warn("[KICHAY] Firestore create aviso:", fsCreateErr);
        }
      }

      if (datosFS && datosFS.perfilCompleto) {
        var nuevaRacha = 1;
        try {
          nuevaRacha = await mod.actualizarAcceso(
            uid,
            datosFS.racha        || 0,
            datosFS.ultimoAcceso || null
          );
        } catch (e) {
          nuevaRacha = datosFS.racha || 1;
        }

        sessionStorage.setItem("kichay_racha",           nuevaRacha);
        sessionStorage.setItem("kichay_intis",           datosFS.intis || 0);
        sessionStorage.setItem("kichay_perfil_completo", "1");
        document.body.classList.add("page-exit");
        setTimeout(function() { window.location.href = "dashboard.html"; }, 420);
      } else {
        // Usuario nuevo: ir a completar perfil
        document.body.classList.add("page-exit");
        setTimeout(function() { window.location.href = "completar-perfil.html"; }, 420);
      }

    } catch (errGeneral) {
      console.error("[KICHAY] Error general login:", errGeneral);
      // Si todo falla, igual permitir flujo con datos de Google
      document.body.classList.add("page-exit");
      setTimeout(function() { window.location.href = "completar-perfil.html"; }, 420);
    }
  };

  // Procesar credencial encolada si existía
  if (_pendingCredential) {
    _procesarLogin(_pendingCredential);
    _pendingCredential = null;
  }

}).catch(function(err) {
  console.error("[KICHAY] Error cargando firebase.js:", err);
  // Fallback sin Firebase: usar Google directo
  _firebaseReady = true;
  _procesarLogin = function(credential) {
    var payload = decodeJwtResponse(credential);
    if (payload) {
      sessionStorage.setItem("kichay_uid",  payload.sub);
      sessionStorage.setItem("kichay_user", payload.given_name || payload.name || "Explorador");
    }
    document.body.classList.add("page-exit");
    setTimeout(function() { window.location.href = "completar-perfil.html"; }, 420);
  };
  if (_pendingCredential) {
    _procesarLogin(_pendingCredential);
    _pendingCredential = null;
  }
});

// ── 6. Modo local (file://) ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  if (window.location.protocol === "file:") {
    var btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) {
      var aviso = document.createElement("div");
      aviso.style.cssText = "margin-top:12px;font-size:12px;color:#D9381E;cursor:pointer;text-decoration:underline;font-weight:700;text-align:center;";
      aviso.textContent   = "Modo prueba local: Clic aqui para entrar";
      aviso.onclick = function() {
        sessionStorage.setItem("kichay_user",            "Daniel");
        sessionStorage.setItem("kichay_uid",             "test-uid-local");
        sessionStorage.setItem("kichay_racha",           "0");
        sessionStorage.setItem("kichay_intis",           "0");
        sessionStorage.setItem("kichay_perfil_completo", "1");
        document.body.classList.add("page-exit");
        setTimeout(function() { window.location.href = "dashboard.html"; }, 420);
      };
      btnWrap.parentNode.insertBefore(aviso, btnWrap.nextSibling);
    }
  }
});
