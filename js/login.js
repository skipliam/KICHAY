/* ================================================================
   KICHAY - Login Script (con Firebase Firestore)
================================================================ */
import {
  auth, GoogleAuthProvider, signInWithCredential,
  obtenerUsuario, crearUsuario, actualizarAcceso
} from "./firebase.js";

// UID del usuario autenticado (se guarda tras el login de Google)
let currentUser = null;

// ── Google OAuth callback (llamado por el SDK de Google) ───────
window.handleGoogleLogin = async function(response) {
  try {
    // 1. Autenticar en Firebase con la credencial de Google
    const credential  = GoogleAuthProvider.credential(response.credential);
    const userCred    = await signInWithCredential(auth, credential);
    const fbUser      = userCred.user;
    currentUser       = fbUser;

    // Guardar uid en sessionStorage para el guard de perfil
    sessionStorage.setItem("kichay_uid", fbUser.uid);

    // 2. Buscar documento en Firestore
    let datosFS = await obtenerUsuario(fbUser.uid);

    if (!datosFS) {
      // Usuario nuevo → crear documento base
      await crearUsuario(fbUser.uid, {
        email:    fbUser.email,
        nombre:   fbUser.displayName || "Explorador",
        photoURL: fbUser.photoURL || ""
      });
      datosFS = await obtenerUsuario(fbUser.uid);
    }

    sessionStorage.setItem("kichay_user", datosFS.nombre || fbUser.displayName || "Explorador");

    // 3. Decidir destino
    if (datosFS.perfilCompleto) {
      // Calcular y actualizar racha antes de ir al dashboard
      const nuevaRacha = await actualizarAcceso(
        fbUser.uid,
        datosFS.racha || 0,
        datosFS.ultimoAcceso || null
      );
      sessionStorage.setItem("kichay_racha",  nuevaRacha);
      sessionStorage.setItem("kichay_intis",  datosFS.intis || 0);
      sessionStorage.setItem("kichay_perfil_completo", "1");

      document.body.classList.add("page-exit");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 420);
    } else {
      // Usuario nuevo o sin perfil → ir al completar-perfil
      document.body.classList.add("page-exit");
      setTimeout(() => { window.location.href = "completar-perfil.html"; }, 420);
    }

  } catch (err) {
    console.error("Error al autenticar con Google:", err);
    alert("Error al iniciar sesión. Intenta de nuevo.");
  }
};

// ── Modo prueba local (file://) ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const isLocalFile = window.location.protocol === "file:";
  if (isLocalFile) {
    const btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "margin-top:12px;font-size:12px;color:#D9381E;cursor:pointer;text-decoration:underline;font-weight:700;text-align:center;";
      aviso.textContent = "⚡ Modo prueba local: Clic aquí para entrar";
      aviso.onclick = () => {
        sessionStorage.setItem("kichay_user",   "Daniel");
        sessionStorage.setItem("kichay_uid",    "test-uid-local");
        sessionStorage.setItem("kichay_racha",  "0");
        sessionStorage.setItem("kichay_intis",  "0");
        sessionStorage.setItem("kichay_perfil_completo", "1");
        document.body.classList.add("page-exit");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 420);
      };
      btnWrap.parentNode.insertBefore(aviso, btnWrap.nextSibling);
    }
  }
});
