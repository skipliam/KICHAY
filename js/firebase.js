/* ================================================================
   KICHAY – Firebase Module
   Expone las funciones via window.KichayFirebase para que
   login.js (script normal) pueda hacer import() dinamico.
================================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Configuracion del proyecto ──────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyA3CiS2I1YIx8133nku6ZCVsupVrh8ehk0",
  authDomain:        "kichay-ab9e3.firebaseapp.com",
  projectId:         "kichay-ab9e3",
  storageBucket:     "kichay-ab9e3.firebasestorage.app",
  messagingSenderId: "972842454156",
  appId:             "1:972842454156:web:e35d3a8d98e6f0adf73fa9"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── Calcular racha diaria ───────────────────────────────────────
function calcularRacha(fechaUltimoAcceso, rachaActual = 0) {
  const ahora = new Date();
  const hoy   = ahora.toISOString().slice(0, 10);
  if (!fechaUltimoAcceso) return { nuevaRacha: 1, hoy };
  const ultimoStr = new Date(fechaUltimoAcceso).toISOString().slice(0, 10);
  if (ultimoStr === hoy) return { nuevaRacha: rachaActual, hoy };
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (ultimoStr === ayer.toISOString().slice(0, 10)) return { nuevaRacha: rachaActual + 1, hoy };
  return { nuevaRacha: 1, hoy };
}

// ── CRUD Firestore ──────────────────────────────────────────────
async function obtenerUsuario(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? snap.data() : null;
}

async function crearUsuario(uid, datos) {
  await setDoc(doc(db, "usuarios", uid), {
    uid,
    email:          datos.email    || "",
    nombre:         datos.nombre   || "Explorador",
    photoURL:       datos.photoURL || "",
    perfilCompleto: false,
    sexo:           "",
    edad:           null,
    racha:          0,
    intis:          0,
    nivelKusi:      1,
    expKusi:        0,
    ultimoAcceso:   null,
    progreso: { historia: 0, fauna: 0, gastronomia: 0, cultura: 0, turismo: 0 },
    creadoEn:       serverTimestamp()
  });
}

async function completarPerfil(uid, datos) {
  await updateDoc(doc(db, "usuarios", uid), {
    nombre:         datos.nombre,
    sexo:           datos.sexo,
    edad:           datos.edad,
    perfilCompleto: true
  });
}

async function actualizarAcceso(uid, rachaActual, fechaUltimo) {
  const { nuevaRacha, hoy } = calcularRacha(fechaUltimo, rachaActual);
  await updateDoc(doc(db, "usuarios", uid), { racha: nuevaRacha, ultimoAcceso: hoy });
  return nuevaRacha;
}

async function cerrarSesion() {
  sessionStorage.clear();
  await signOut(auth);
}

// ── Exponer TODO en window.KichayFirebase ─────────────────────────
// Esto permite que login.js y dashboard.js (scripts normales) accedan
// a las funciones mediante import() dinamico o window.KichayFirebase
window.KichayFirebase = {
  db, auth,
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged,
  obtenerUsuario, crearUsuario, completarPerfil,
  actualizarAcceso, cerrarSesion, calcularRacha
};

// Tambien exportar para quien use import() ESM
export {
  db, auth,
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged,
  obtenerUsuario, crearUsuario, completarPerfil,
  actualizarAcceso, cerrarSesion, calcularRacha
};
