/* ================================================================
   KICHAY – Dashboard Script
================================================================ */

// ── Recuperar nombre del usuario desde sessionStorage ──────────
const nombre = sessionStorage.getItem("kichay_user") || "Explorador";
const nombreEl = document.getElementById("nombre-usuario");
const avatarEl = document.getElementById("avatar-initial");

if (nombreEl) nombreEl.textContent = nombre;
if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();

// ── Cerrar sesión ──────────────────────────────────────────────
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem("kichay_user");
    window.location.href = "index.html";
  });
}

// ── Tarjetas de materia: hover + click ────────────────────────
document.querySelectorAll(".subject-card").forEach(card => {
  card.addEventListener("click", () => {
    // En el siguiente paso se navegará al mapa temático correspondiente
    const label = card.querySelector(".card-label").textContent.trim();
    console.log("Navegar a:", label);
  });
});

// ── Botón Comenzar misión ──────────────────────────────────────
const btnComenzar = document.querySelector(".btn-comenzar");
if (btnComenzar) {
  btnComenzar.addEventListener("click", () => {
    // Navegar al primer mapa temático disponible
    console.log("Comenzar misión de Kusi");
  });
}
