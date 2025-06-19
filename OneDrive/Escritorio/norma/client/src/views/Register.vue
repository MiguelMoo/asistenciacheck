<template>
  <div class="min-h-screen flex items-center justify-center bg-white px-4">
    <div class="w-full max-w-md">
      <button @click="router.back()" class="text-2xl mb-4">&larr;</button>
      <h1 class="text-3xl font-bold text-center mb-6">ListApp</h1> 

      <form @submit.prevent="register" class="bg-white p-6 rounded-lg shadow-md space-y-4 mb-6"> 
        <div class="flex gap-2">
          <div class="w-1/2">
            <p class="text-sm font-medium text-gray-700 mb-1">Nombre*</p>
            <input v-model="nombre" placeholder="Nombre*" required
                   class="w-full p-2 border rounded outline-none focus:ring focus:border-blue-500" />
          </div>
          <div class="w-1/2">
            <p class="text-sm font-medium text-gray-700 mb-1">Apellido*</p>
            <input v-model="apellido" placeholder="Apellido*" required
                   class="w-full p-2 border rounded outline-none focus:ring focus:border-blue-500" />
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Correo*</p>
          <input v-model="correo" type="email" placeholder="Correo*" required
                 class="w-full p-2 border rounded outline-none focus:ring focus:border-blue-500" />
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Contraseña*</p>
          <input v-model="password" type="password" placeholder="Contraseña*" required
                 class="w-full p-2 border rounded outline-none focus:ring focus:border-blue-500" />
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Confirmar contraseña*</p>
          <input v-model="confirmar" type="password" placeholder="Confirmar contraseña*" required
                 class="w-full p-2 border rounded outline-none focus:ring focus:border-blue-500" />
        </div>

        <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">
          Registrarse
        </button>
      </form>

      <p class="text-center mt-6 text-sm text-gray-600">o regístrate con:</p>
      <div class="flex justify-center mt-2 mb-2">
        <button @click="googleRegister"
                class="flex items-center border p-2 rounded hover:bg-gray-100 transition">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5 mr-2" />
          Google
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getSelectedRol, clearSelectedRol } from '../utils/rolStorage';
import { isValidEmail, isValidText, sanitize } from '../utils/validators';
import Swal from 'sweetalert2';

const router = useRouter();
const auth = getAuth();
const db = getFirestore();

const role = getSelectedRol();
if (!role || (role !== 'alumno' && role !== 'profesor')) {
  router.push('/select-role');
}

const nombre = ref('');
const apellido = ref('');
const correo = ref('');
const password = ref('');
const confirmar = ref('');

async function register() {
  if (!isValidEmail(correo.value)) {
    return Swal.fire('Correo inválido', 'Tu dominio no está permitido.', 'error');
  }

  if (!isValidText(nombre.value) || !isValidText(apellido.value)) {
    return Swal.fire('Texto inválido', 'Nombre y apellido solo pueden contener letras.', 'error');
  }

  if (password.value !== confirmar.value || password.value.length < 6) {
    return Swal.fire('Contraseña inválida', 'Debe tener al menos 6 caracteres y coincidir.', 'error');
  }

  const safeNombre = sanitize(nombre.value);
  const safeApellido = sanitize(apellido.value);
  const safeCorreo = sanitize(correo.value);

  try {
    const cred = await createUserWithEmailAndPassword(auth, safeCorreo, password.value);
    await updateProfile(cred.user, { displayName: `${safeNombre} ${safeApellido}` });

    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nombre: safeNombre,
      apellido: safeApellido,
      correo: safeCorreo,
      rol: role,
      uid: cred.user.uid
    });

    clearSelectedRol();
    await Swal.fire('Registro exitoso', '¡Bienvenido al sistema!', 'success');
    router.push('/home');
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

async function googleRegister() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, 'usuarios', user.uid), {
      nombre: user.displayName?.split(' ')[0] || '',
      apellido: user.displayName?.split(' ')[1] || '',
      correo: user.email,
      rol: role,
      uid: user.uid
    }, { merge: true });

    clearSelectedRol();
    router.push('/home');
  } catch (error) {
    Swal.fire('Error con Google', error.message, 'error');
  }
}
</script>
