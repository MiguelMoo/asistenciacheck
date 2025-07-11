<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
    <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
      <h2 class="text-4xl font-extrabold text-center mb-8 text-gray-900">ListApp</h2>

      <form @submit.prevent="login" class="space-y-6">
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Correo electrónico*</p>
          <input v-model="email" type="email"
                 class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="ejemplo@correo.com" required />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Contraseña*</p>
          <input v-model="password" type="password"
                 class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="••••••••" required />
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out font-semibold shadow-md">
          Iniciar sesión
        </button>
      </form>

      <hr class="my-8 border-gray-200" />
      <p class="text-center text-gray-600 text-sm mb-4">o ingresa con:</p>
      <button @click="loginWithGoogle"
              class="flex items-center justify-center w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition duration-300 text-gray-700 font-semibold shadow-sm">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-6 h-6 mr-3" />
        Google
      </button>

      <p class="text-center mt-6 text-sm text-gray-600">
        ¿No tienes cuenta? <router-link to="/select-role" class="text-blue-600 hover:text-blue-800 font-bold ml-1">Regístrate</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Swal from 'sweetalert2';
import {  collection,  query,  where,  getDocs} from 'firebase/firestore';
import { db } from '../main';

const email = ref('');
const password = ref('');
const router = useRouter();
const auth = getAuth();

async function login() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    await Swal.fire('Bienvenido', 'Inicio de sesión exitoso', 'success');
    router.push('/home');
  } catch (error) {
    const errores = {
      'auth/user-not-found': 'El correo no está registrado.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/invalid-email': 'El formato del correo no es válido.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
      'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    };

    const mensaje = errores[error.code] || 'Ocurrió un error al iniciar sesión.';
    console.error('[LOGIN ERROR]', error.code, error.message);
    Swal.fire('Error al iniciar sesión', mensaje, 'error');
  }
}


async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const correo = user.email?.toLowerCase(); // por seguridad

    // Validación mínima
    if (!correo) {
      await signOut(auth);
      return Swal.fire('Error', 'No se pudo obtener el correo del usuario.', 'error');
    }

    // Esperar búsqueda en Firestore
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('correo', '==', correo));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await signOut(auth);
      return await Swal.fire('Acceso denegado', 'Este correo no está registrado en el sistema.', 'error');
    }

    // Mostrar bienvenida y esperar confirmación antes de redirigir
    await Swal.fire('Bienvenido', 'Sesión iniciada con Google', 'success');

    // Asegurarse que la sesión esté lista
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('[WARN] Usuario no está autenticado después del login.');
      return Swal.fire('Error', 'No se pudo mantener la sesión iniciada.', 'error');
    }

    // Redirigir con seguridad
    router.push('/home');

  } catch (error) {
    console.error('[ERROR] Login con Google:', error);
    await Swal.fire('Error con Google', error.message, 'error');
  }
}


</script>
