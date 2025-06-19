<template>
  <div class="qr-scanner-container p-4">
    <h2 class="text-xl font-semibold mb-4">Escanear Código QR</h2>
    <p class="text-gray-700 mb-6">Coloca el código QR de asistencia dentro del recuadro para registrar tu entrada.</p>

    <div class="scanner-wrapper relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
<QrcodeStream
  @decode="onDecode"
  @loaded="onLoaded"
  @init="onInit"
  class="w-full h-full object-cover"
/>
      <div v-if="scanning" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-lg">
        Iniciando cámara...
      </div>

<p v-if="cameraError" class="mt-4 text-red-500 font-semibold text-center">
  {{ cameraError }}
</p>

    </div>

    <p v-if="decodedText" class="mt-4 text-center text-green-600 font-medium">
      Código escaneado: {{ decodedText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'

const decodedText = ref('')
const scanning = ref(true)
const cameraError = ref('')
const emit = defineEmits(['qr-scanned'])

const onDecode = (result: string) => {
  if (result && !decodedText.value) {
    decodedText.value = result
    emit('qr-scanned', result)
  }
}

const onLoaded = () => {
  scanning.value = false
  console.log("Cámara lista.")
}

const onInit = (promise: Promise<void>) => {
  console.log("🟡 Iniciando cámara...");
  promise
    .then(() => {
      console.log("✅ Cámara inicializada correctamente");
    })
    .catch(err => {
      scanning.value = false;
      console.error("❌ Error en init:", err);
      if (err.name === 'NotAllowedError') {
        cameraError.value = 'Permiso denegado para acceder a la cámara.';
      } else if (err.name === 'NotFoundError') {
        cameraError.value = 'No se encontró ninguna cámara.';
      } else if (err.name === 'NotReadableError') {
        cameraError.value = 'La cámara está siendo usada por otra aplicación.';
      } else {
        cameraError.value = 'Error al iniciar cámara: ' + err.message;
      }
    });
}
</script>

<style scoped>
.scanner-wrapper {
  position: relative;
}
</style>
