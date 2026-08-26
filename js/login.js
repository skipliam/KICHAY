/* ================================================================
   KICHAY – Login Script
================================================================ */

// ── Ir al perfil (siguiente paso después del login) ────────────
function pasarAlDashboard(nombre) {
  sessionStorage.setItem("kichay_user", nombre || "Explorador");
  // Si ya completó el perfil antes, ir directo al dashboard
  if (sessionStorage.getItem("kichay_perfil_completo")) {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "perfil.html";
  }
}

// ── Login con formulario (email + contraseña) ──────────────────
function loginConFormulario() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    // Sacudir el botón para indicar que faltan campos
    const btn = document.querySelector(".btn-primary");
    btn.style.animation = "none";
    void btn.offsetWidth;
    btn.style.animation = "shake 0.4s ease";
    return;
  }

  // Extraer nombre del email (parte antes del @)
  const nombre = email.split("@")[0];
  pasarAlDashboard(nombre);
}

// ── Google OAuth callback ──────────────────────────────────────
function decodeJwtResponse(token) {
  let base64Url = token.split(".")[1];
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  let jsonPayload = decodeURIComponent(
    window.atob(base64).split("").map(function(c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
  return JSON.parse(jsonPayload);
}

function handleGoogleLogin(response) {
  try {
    const payload = decodeJwtResponse(response.credential);
    const nombre  = payload.given_name || payload.name || "Explorador";
    pasarAlDashboard(nombre);
  } catch (err) {
    console.error("Error al procesar login de Google:", err);
    pasarAlDashboard("Explorador");
  }
}

// ── Soporte para pruebas locales (si se abre directo como archivo file://) ──
document.addEventListener("DOMContentLoaded", () => {
  const isLocalFile = window.location.protocol === "file:";
  if (isLocalFile) {
    const btnWrap = document.querySelector(".google-btn-wrap");
    if (btnWrap) {
      // Si Google no carga o falla en local, dar alternativa de un clic
      const aviso = document.createElement("div");
      aviso.style.cssText = "margin-top:12px; font-size:12px; color:#D9381E; cursor:pointer; text-decoration:underline; font-weight:700; text-align:center;";
      aviso.textContent = "⚡ Modo prueba local: Clic aquí para entrar";
      aviso.onclick = () => pasarAlDashboard("Daniel");
      btnWrap.parentNode.insertBefore(aviso, btnWrap.nextSibling);
    }
  }
});

// Exponer funciones globalmente
window.handleGoogleLogin   = handleGoogleLogin;
window.loginConFormulario  = loginConFormulario;
window.pasarAlDashboard    = pasarAlDashboard;

// ── Toggle mostrar/ocultar contraseña ─────────────────────────
const toggleBtn = document.getElementById("togglePass");
const passInput = document.getElementById("password");
const eyeOff    = document.getElementById("eyeOff");
const eyeOn     = document.getElementById("eyeOn");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = passInput.type === "password";
    passInput.type       = isHidden ? "text" : "password";
    eyeOff.style.display = isHidden ? "none" : "";
    eyeOn.style.display  = isHidden ? ""     : "none";
  });
}

// ── Permitir Enter en los campos para hacer login ─────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginConFormulario();
});

// ── Animación shake ────────────────────────────────────────────
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);
