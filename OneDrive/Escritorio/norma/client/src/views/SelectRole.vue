<template>
  <div class="container mt-5">
    <div class="text-center">
      <h2>Bienvenido a<br /><strong>*nombre de la app*</strong></h2>
      <p class="mt-2">Escoge cómo deseas acceder</p>
    </div>

    <div class="row justify-content-center mt-4">
      <div class="col-6 col-sm-4 col-md-3">
        <div class="card text-center p-3 shadow-sm role-card" @click="selectRole('profesor')">
          <span style="font-size: 2rem;">👨‍🏫</span>
          <p class="mt-2 mb-0">Profesor</p>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-3">
        <div class="card text-center p-3 shadow-sm role-card" @click="selectRole('alumno')">
          <span style="font-size: 2rem;">🎓</span>
          <p class="mt-2 mb-0">Alumno</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-4">
      <p class="mb-0">¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { setSelectedRol } from '../utils/rolStorage';

const router = useRouter();

function selectRole(role) {
  setSelectedRol(role);
  router.push('/register');
}
</script>

<style scoped>
.role-card {
  cursor: pointer;
  transition: 0.2s ease;
  background-color: #fff;
}
.role-card:hover {
  background-color: #007bff;
  color: #fff;
}
</style>
