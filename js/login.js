/* ================================================================
   KICHAY – Login Script
   Incluye: Google OAuth, toggle contraseña, formulario tradicional
================================================================ */

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
  const payload = decodeJwtResponse(response.credential);
  const nombre  = payload.given_name || payload.name || "Explorador";
  pasarAlDashboard(nombre);
}

// ── Navegación al dashboard ────────────────────────────────────
function pasarAlDashboard(nombre) {
  // Guardar nombre en sessionStorage para usarlo en dashboard.html
  sessionStorage.setItem("kichay_user", nombre);
  // Navegar al dashboard
  window.location.href = "dashboard.html";
}

// Exponer globalmente para que Google SDK pueda llamarla
window.handleGoogleLogin = handleGoogleLogin;

// ── Toggle mostrar/ocultar contraseña ─────────────────────────
const toggleBtn = document.getElementById("togglePass");
const passInput = document.getElementById("password");
const eyeOff    = document.getElementById("eyeOff");
const eyeOn     = document.getElementById("eyeOn");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = passInput.type === "password";
    passInput.type  = isHidden ? "text" : "password";
    eyeOff.style.display = isHidden ? "none" : "";
    eyeOn.style.display  = isHidden ? ""     : "none";
  });
}

// ── Formulario tradicional ─────────────────────────────────────
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      shake(loginForm.querySelector(".btn-primary"));
      return;
    }
    // En producción: validar contra backend.
    // Por ahora usamos el email como nombre de usuario:
    const nombre = email.split("@")[0];
    pasarAlDashboard(nombre);
  });
}

// ── Animación shake al error ───────────────────────────────────
function shake(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "shake 0.4s ease";
}

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
