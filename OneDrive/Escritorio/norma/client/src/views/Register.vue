<template>
  <div class="container mt-5">
    <div class="card p-4 shadow">
      <h2 class="text-center">*nombre de la app*</h2>
      <p class="text-center">Registrarse como <strong>{{ role }}</strong></p>

      <form @submit.prevent="register">
        <div class="row mb-3">
          <div class="col">
            <input v-model="nombre" class="form-control" placeholder="Nombre*" required />
          </div>
          <div class="col">
            <input v-model="apellido" class="form-control" placeholder="Apellido*" required />
          </div>
        </div>

        <div class="mb-3">
          <input v-model="correo" class="form-control" type="email" placeholder="Correo electrónico*" required />
        </div>

        <div class="mb-3">
          <input v-model="password" class="form-control" type="password" placeholder="Contraseña*" required />
        </div>

        <div class="mb-3">
          <input v-model="confirmar" class="form-control" type="password" placeholder="Confirmar contraseña*" required />
        </div>

        <button type="submit" class="btn btn-primary w-100">Registrarse</button>
      </form>

      <hr />
      <p class="text-center">o regístrate con:</p>
      <button class="btn btn-outline-dark w-100" @click="googleRegister">Google</button>
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
