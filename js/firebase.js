/* ================================================================
   KICHAY – Firebase Module (con setDoc merge:true garantizado)
================================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
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
  if (ultimoStr === hoy) return { nuevaRacha: rachaActual || 1, hoy };
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (ultimoStr === ayer.toISOString().slice(0, 10)) return { nuevaRacha: (rachaActual || 0) + 1, hoy };
  return { nuevaRacha: 1, hoy };
}

// ── CRUD Firestore Seguro ───────────────────────────────────────
async function obtenerUsuario(uid) {
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem("kichay_user_cache_" + uid, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("[KICHAY] Error leyendo Firestore, usando cache local:", err);
  }
  // Fallback cache local
  const local = localStorage.getItem("kichay_user_cache_" + uid);
  return local ? JSON.parse(local) : null;
}

async function crearUsuario(uid, datos) {
  const usuarioObj = {
    uid,
    email:          datos.email    || "",
    nombre:         datos.nombre   || "Explorador",
    photoURL:       datos.photoURL || "",
    perfilCompleto: false,
    sexo:           "",
    edad:           null,
    racha:          1,
    intis:          0,
    nivelKusi:      1,
    expKusi:        0,
    ultimoAcceso:   new Date().toISOString().slice(0, 10),
    progreso: { historia: 0, fauna: 0, gastronomia: 0, cultura: 0, turismo: 0 }
  };
  localStorage.setItem("kichay_user_cache_" + uid, JSON.stringify(usuarioObj));
  try {
    await setDoc(doc(db, "usuarios", uid), {
      ...usuarioObj,
      creadoEn: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("[KICHAY] Firestore write aviso (guardado localmente):", err);
  }
}

async function completarPerfil(uid, datos) {
  const patch = {
    nombre:         datos.nombre,
    sexo:           datos.sexo,
    edad:           datos.edad,
    perfilCompleto: true,
    racha:          1,
    ultimoAcceso:   new Date().toISOString().slice(0, 10)
  };
  // Guardar en cache local
  const actual = await obtenerUsuario(uid) || {};
  const merged = { ...actual, ...patch };
  localStorage.setItem("kichay_user_cache_" + uid, JSON.stringify(merged));
  localStorage.setItem("kichay_ultimo_usuario", uid);

  // Guardar en Firestore
  await setDoc(doc(db, "usuarios", uid), patch, { merge: true });
}

async function actualizarAcceso(uid, rachaActual, fechaUltimo) {
  const { nuevaRacha, hoy } = calcularRacha(fechaUltimo, rachaActual);
  const patch = { racha: nuevaRacha, ultimoAcceso: hoy };
  
  const actual = await obtenerUsuario(uid) || {};
  localStorage.setItem("kichay_user_cache_" + uid, JSON.stringify({ ...actual, ...patch }));

  try {
    await setDoc(doc(db, "usuarios", uid), patch, { merge: true });
  } catch (e) {
    console.warn("[KICHAY] No se pudo actualizar racha en Firestore:", e);
  }
  return nuevaRacha;
}

async function guardarProgresoUsuario(uid, updateData) {
  try {
    const userRef = doc(db, "usuarios", uid);
    const actual = await obtenerUsuario(uid) || {};
    const mergedProgreso = {
      ...(actual.progresoHistoria || {}),
      ...(actual.progreso || {}),
      ...(updateData.progresoHistoria || {}),
      ...(updateData.progreso || {})
    };
    const payload = {
      ...updateData,
      progresoHistoria: mergedProgreso,
      progreso: mergedProgreso,
      ultimoAcceso: new Date().toISOString()
    };
    const mergedFull = { ...actual, ...payload };
    localStorage.setItem("kichay_user_cache_" + uid, JSON.stringify(mergedFull));
    await setDoc(userRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn("[KICHAY Firebase] Error en guardarProgresoUsuario:", err);
    return false;
  }
}

async function cerrarSesion() {
  sessionStorage.clear();
  try {
    await signOut(auth);
  } catch (e) {}
}

window.KichayFirebase = {
  db, auth,
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged,
  obtenerUsuario, crearUsuario, completarPerfil,
  actualizarAcceso, guardarProgresoUsuario, cerrarSesion, calcularRacha
};

export {
  db, auth,
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged,
  obtenerUsuario, crearUsuario, completarPerfil,
  actualizarAcceso, guardarProgresoUsuario, cerrarSesion, calcularRacha
};
