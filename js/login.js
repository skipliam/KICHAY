/* ================================================================
   KICHAY - Login Script v3
   Patron: stub global + import() dinamico de Firebase
================================================================ */

// ── 1. Cola de credenciales ───────────────────────────────────────
var _pendingCredential = null;
var _firebaseReady     = false;
var _procesarLogin     = null;

// ── 2. STUB GLOBAL — Google SDK lo llama al hacer clic ───────────
window.handleGoogleLogin = function(response) {
  if (_firebaseReady && _procesarLogin) {
    _procesarLogin(response.credential);
  } else {
    _pendingCredential = response.credential;
  }
};

// ── 3. Resolver URL de firebase.js de forma segura ───────────────
var _scriptSrc = "";
var _scripts   = document.querySelectorAll('script[src*="login.js"]');
if (_scripts.length > 0) {
  _scriptSrc = _scripts[_scripts.length - 1].src;
}
var firebaseUrl = _scriptSrc
  ? new URL("./firebase.js", _scriptSrc).href
  : (location.origin + "/js/firebase.js");

// ── 4. Cargar Firebase con import() dinamico ─────────────────────
import(firebaseUrl).then(function(mod) {

  _firebaseReady = true;

  _procesarLogin = function(credential) {
    var btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) {
      btnWrap.style.opacity       = "0.6";
      btnWrap.style.pointerEvents = "none";
    }

    // Autenticar con Firebase
    var googleCred = mod.GoogleAuthProvider.credential(credential);
    mod.signInWithCredential(mod.auth, googleCred)
      .then(function(userCred) {
        var fbUser = userCred.user;
        sessionStorage.setItem("kichay_uid", fbUser.uid);
        return mod.obtenerUsuario(fbUser.uid).then(function(datosFS) {
          if (!datosFS) {
            return mod.crearUsuario(fbUser.uid, {
              email:    fbUser.email         || "",
              nombre:   fbUser.displayName   || "Explorador",
              photoURL: fbUser.photoURL      || ""
            }).then(function() {
              return mod.obtenerUsuario(fbUser.uid);
            });
          }
          return datosFS;
        }).then(function(datosFS) {
          var nombre = datosFS.nombre || fbUser.displayName || "Explorador";
          sessionStorage.setItem("kichay_user", nombre);

          if (datosFS.perfilCompleto) {
            return mod.actualizarAcceso(
              fbUser.uid,
              datosFS.racha        || 0,
              datosFS.ultimoAcceso || null
            ).then(function(nuevaRacha) {
              sessionStorage.setItem("kichay_racha",           nuevaRacha);
              sessionStorage.setItem("kichay_intis",           datosFS.intis || 0);
              sessionStorage.setItem("kichay_perfil_completo", "1");
              document.body.classList.add("page-exit");
              setTimeout(function() { window.location.href = "dashboard.html"; }, 420);
            });
          } else {
            document.body.classList.add("page-exit");
            setTimeout(function() { window.location.href = "completar-perfil.html"; }, 420);
          }
        });
      })
      .catch(function(err) {
        console.error("[KICHAY] Error Firebase:", err.code, err.message);

        if (btnWrap) {
          btnWrap.style.opacity       = "";
          btnWrap.style.pointerEvents = "";
        }

        var msg;
        var code = err.code || "";

        if (code === "auth/unauthorized-domain") {
          msg = "Dominio no autorizado. Ve a Google Cloud Console > OAuth 2.0 > Authorized origins y agrega este dominio.";
        } else if (code === "auth/network-request-failed") {
          msg = "Sin conexion a internet. Verifica tu red.";
        } else if (code === "auth/invalid-credential" || code === "auth/invalid-id-token") {
          msg = "Token invalido. Recarga la pagina e intenta de nuevo.";
        } else if (code === "auth/popup-blocked") {
          msg = "Popup bloqueado. Permite ventanas emergentes en tu navegador.";
        } else {
          msg = "Error (" + (code || "desconocido") + "): " + (err.message || "Intenta de nuevo.");
        }
        mostrarErrorLogin(msg);
      });
  };

  // Procesar credencial encolada si existia
  if (_pendingCredential) {
    _procesarLogin(_pendingCredential);
    _pendingCredential = null;
  }

}).catch(function(err) {
  console.error("[KICHAY] Error cargando firebase.js:", err);
  mostrarErrorLogin("Error cargando Firebase: " + err.message + ". Recarga la pagina.");
});

// ── 5. Mostrar error en tarjeta ──────────────────────────────────
function mostrarErrorLogin(msg) {
  var errEl = document.getElementById("login-error");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.id = "login-error";
    errEl.style.cssText = [
      "margin-top:10px", "font-size:11px", "font-weight:700",
      "color:#C62828", "background:#FFEBEE",
      "border:1.5px solid #FFCDD2", "border-radius:10px",
      "padding:8px 12px", "text-align:center",
      "display:block", "line-height:1.4", "word-break:break-word"
    ].join(";");
    var card = document.querySelector(".login-card");
    if (card) card.appendChild(errEl);
  }
  errEl.textContent = msg;
}

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
