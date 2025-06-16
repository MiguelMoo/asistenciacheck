<template>
  <div class="container mt-5">
    <div class="card p-4 shadow">
      <h2 class="text-center">*nombre de la app*</h2>

      <form @submit.prevent="login" class="mt-3">
        <div class="mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Correo electrónico*" required />
        </div>
        <div class="mb-3">
          <input v-model="password" type="password" class="form-control" placeholder="Contraseña*" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Iniciar sesión</button>
      </form>

      <hr class="my-4" />
      <p class="text-center">o ingresa con:</p>
      <button @click="loginWithGoogle" class="btn btn-outline-dark w-100">Google</button>

      <p class="text-center mt-3">¿No tienes cuenta? <router-link to="/select-role">Regístrate</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Swal from 'sweetalert2';

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
    Swal.fire('Error al iniciar sesión', error.message, 'error');
  }
}

async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await Swal.fire('Bienvenido', 'Sesión iniciada con Google', 'success');
    router.push('/home');
  } catch (error) {
    Swal.fire('Error con Google', error.message, 'error');
  }
}
</script>
