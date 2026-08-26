/* ================================================================
   KICHAY – Dashboard Script
================================================================ */

// ── Recuperar nombre del usuario desde sessionStorage ──────────
const nombre = sessionStorage.getItem("kichay_user") || "Explorador";
const nombreEl = document.getElementById("nombre-usuario");
const avatarEl = document.getElementById("avatar-initial");

if (nombreEl) nombreEl.textContent = nombre;
if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();

// ── Cerrar sesión con transición ──────────────────────────────
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.add("page-exit");
    sessionStorage.removeItem("kichay_user");
    sessionStorage.removeItem("kichay_perfil_completo");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 400);
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

// ── Menú lateral móvil (Drawer) ────────────────────────────────
const mobileMenuBtn    = document.getElementById("mobileMenuBtn");
const sidebarCloseBtn  = document.getElementById("sidebarCloseBtn");
const sidebarBackdrop  = document.getElementById("sidebarBackdrop");
const mainSidebar      = document.getElementById("mainSidebar");

function toggleMobileSidebar(open) {
  if (mainSidebar && sidebarBackdrop) {
    if (open) {
      mainSidebar.classList.add("open");
      sidebarBackdrop.classList.add("active");
    } else {
      mainSidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("active");
    }
  }
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => toggleMobileSidebar(true));
}
if (sidebarCloseBtn) {
  sidebarCloseBtn.addEventListener("click", () => toggleMobileSidebar(false));
}
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", () => toggleMobileSidebar(false));
}

// Cerrar sidebar al hacer click en cualquier link de navegación en móvil
document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      toggleMobileSidebar(false);
    }
  });
});
