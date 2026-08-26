/* ================================================================
   KICHAY - Login Script
   Patron: stub global inmediato + import() dinamico de Firebase
================================================================ */

// ── 1. Cola de credenciales (si el clic llega antes que Firebase) ─
let _pendingCredential = null;
let _firebaseReady     = false;
let _procesarLogin     = null;

// ── 2. STUB GLOBAL — disponible antes que el SDK de Google ───────
//    Google llama a esta funcion al hacer clic en "Continuar con Google"
window.handleGoogleLogin = function(response) {
  if (_firebaseReady && _procesarLogin) {
    _procesarLogin(response.credential);
  } else {
    _pendingCredential = response.credential;
  }
};

// ── 3. Cargar Firebase como modulo ESM dinamico ──────────────────
//    (funciona en Vercel/HTTPS, no en file://)
const firebaseUrl = new URL("./firebase.js", document.currentScript
  ? document.currentScript.src
  : location.href).href;

import(firebaseUrl).then(function(mod) {

  _firebaseReady = true;

  // ── Funcion principal de procesamiento ────────────────────────
  _procesarLogin = async function(credential) {
    const btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) { btnWrap.style.opacity = "0.6"; btnWrap.style.pointerEvents = "none"; }

    try {
      // Autenticar con Firebase Auth
      const googleCred = mod.GoogleAuthProvider.credential(credential);
      const userCred   = await mod.signInWithCredential(mod.auth, googleCred);
      const fbUser     = userCred.user;

      sessionStorage.setItem("kichay_uid", fbUser.uid);

      // Buscar o crear usuario en Firestore
      let datosFS = await mod.obtenerUsuario(fbUser.uid);

      if (!datosFS) {
        await mod.crearUsuario(fbUser.uid, {
          email:    fbUser.email         || "",
          nombre:   fbUser.displayName   || "Explorador",
          photoURL: fbUser.photoURL      || ""
        });
        datosFS = await mod.obtenerUsuario(fbUser.uid);
      }

      const nombre = datosFS.nombre || fbUser.displayName || "Explorador";
      sessionStorage.setItem("kichay_user", nombre);

      if (datosFS.perfilCompleto) {
        // Usuario existente: actualizar racha y ir al dashboard
        var nuevaRacha = await mod.actualizarAcceso(
          fbUser.uid,
          datosFS.racha        || 0,
          datosFS.ultimoAcceso || null
        );
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

    } catch (err) {
      console.error("[KICHAY] Error login:", err);
      if (btnWrap) { btnWrap.style.opacity = ""; btnWrap.style.pointerEvents = ""; }

      var msg = "Error al iniciar sesion. Intenta de nuevo.";
      if (err.code === "auth/unauthorized-domain")       msg = "Dominio no autorizado en Firebase. Revisa la configuracion.";
      else if (err.code === "auth/network-request-failed") msg = "Sin conexion. Verifica tu red e intenta de nuevo.";
      else if (err.code === "auth/popup-blocked")         msg = "El navegador bloqueo el popup. Permite ventanas emergentes.";
      mostrarErrorLogin(msg);
    }
  };

  // Si habia credencial encolada, procesarla ya
  if (_pendingCredential) {
    _procesarLogin(_pendingCredential);
    _pendingCredential = null;
  }

}).catch(function(err) {
  console.error("[KICHAY] Error al cargar Firebase:", err);
  mostrarErrorLogin("Error al cargar la app. Recarga la pagina.");
});

// ── 4. Helper: mostrar error visible en la tarjeta de login ──────
function mostrarErrorLogin(msg) {
  var errEl = document.getElementById("login-error");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.id = "login-error";
    errEl.style.cssText = [
      "margin-top:10px", "font-size:12px", "font-weight:700",
      "color:#C62828", "background:#FFEBEE",
      "border:1.5px solid #FFCDD2", "border-radius:10px",
      "padding:8px 12px", "text-align:center", "display:block"
    ].join(";");
    var card = document.querySelector(".login-card");
    if (card) card.appendChild(errEl);
  }
  errEl.textContent = msg;
}

// ── 5. Modo prueba local (file://) ───────────────────────────────
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
