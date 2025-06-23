<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
      <button
        @click="closeModal"
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Marcar Asistencia</h2>

      <div class="mb-4">
        <label for="classCode" class="block text-sm font-medium text-gray-700 mb-1">
          Código de Clase:
        </label>
        <input
          type="text"
          id="classCode"
          v-model="inputClassCode"
          disabled
          class="mt-1 block w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
        />
        <p class="text-sm text-gray-500 mt-1">Este es el código de la clase a la que asistirás.</p>
      </div>

      <div class="mb-6 border p-4 rounded-md bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 text-center">Escanear Código QR</h3>
        <div id="qr-reader" class="w-full h-auto max-h-[300px] overflow-hidden rounded-md border border-gray-300 bg-black"></div>
        <p v-if="qrError" class="text-red-500 text-sm mt-2 text-center">{{ qrError }}</p>
        <p v-if="qrMessage" class="text-green-600 text-sm mt-2 text-center">{{ qrMessage }}</p>
        <p class="text-sm text-gray-500 mt-2 text-center">Asegúrate de que el código QR esté bien iluminado y centrado.</p>
      </div>
      <div class="mb-6">
        <label for="attendanceCode" class="block text-sm font-medium text-gray-700 mb-1">
          Código de Asistencia Temporal:
        </label>
        <input
          type="text"
          id="attendanceCode"
          v-model="inputAttendanceCode"
          placeholder="Ingresa el código o escanéalo"
          :class="{ 'border-red-500': attendanceCodeError }"
          class="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p v-if="attendanceCodeError" class="text-red-500 text-sm mt-1">{{ attendanceCodeError }}</p>
      </div>

      <button
        @click="submitAttendance"
        :disabled="isSubmitting || !inputAttendanceCode"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">Marcando Asistencia...</span>
        <span v-else>Confirmar Asistencia</span>
      </button>

      <div v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md text-center">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'; // Añadir onUnmounted
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode"; // Importar Html5QrcodeScanner

const props = defineProps<{
  classId: string;
  classCode: string; // The static code for the class (e.g., 'GX8n3ChttiKnsx1JWLOp')
}>();

const emit = defineEmits(['close', 'attendance-marked']);

const auth = getAuth();
const db = getFirestore();

const inputClassCode = ref(props.classCode);
const inputAttendanceCode = ref('');
const attendanceCodeError = ref<string | null>(null);
const message = ref<string | null>(null);
const messageClass = ref<string>('');
const isSubmitting = ref(false);

// Nuevos estados para el escáner QR
const qrScanner = ref<Html5QrcodeScanner | null>(null);
const qrError = ref<string | null>(null);
const qrMessage = ref<string | null>(null);

// Función para cerrar el modal y detener el escáner
const closeModal = async () => {
  if (qrScanner.value) {
    try {
      await qrScanner.value.clear();
      console.log("QR scanner cleared.");
    } catch (err) {
      console.error("Error clearing QR scanner:", err);
    }
  }
  emit('close');
};

// Función que se ejecuta cuando el QR es escaneado con éxito
const onScanSuccess = (decodedText: string, decodedResult: any) => {
  console.log(`QR Code matched = ${decodedText}`, decodedResult);
  inputAttendanceCode.value = decodedText; // Autocompleta el campo de texto
  qrMessage.value = 'Código QR escaneado con éxito!';
  // Opcionalmente, puedes detener el escáner automáticamente después de un escaneo exitoso
  if (qrScanner.value) {
    qrScanner.value.clear().catch((err: any) => console.error("Error clearing QR scanner after scan:", err));
  }
};

// Función que se ejecuta si hay un error al escanear
const onScanError = (errorMessage: string) => {
  // console.warn(`QR Code Scan Error: ${errorMessage}`); // Demasiado ruidoso si no hay QR
  qrError.value = 'Esperando código QR...'; // Mensaje amigable mientras espera
  if (errorMessage.includes("NotAllowedError")) {
    qrError.value = 'Acceso a la cámara denegado. Por favor, permite el acceso en la configuración de tu navegador.';
  } else if (errorMessage.includes("NotFoundError")) {
    qrError.value = 'No se encontró una cámara. Asegúrate de tener una cámara conectada y funcionando.';
  }
};

const submitAttendance = async () => {
  attendanceCodeError.value = null;
  message.value = null;
  messageClass.value = '';
  isSubmitting.value = true;

  const studentUid = auth.currentUser?.uid;
  if (!studentUid) {
    message.value = 'Debes iniciar sesión para marcar asistencia.';
    messageClass.value = 'bg-red-100 text-red-700';
    isSubmitting.value = false;
    return;
  }

  console.log('--- MarkAttendanceModal Debug ---');
  console.log('Current User UID:', studentUid);
  console.log('Class ID received (props.classId):', props.classId);
  console.log('Input Attendance Code:', inputAttendanceCode.value);
  console.log('--- END DEBUGGING LOGS ---');

  if (!inputAttendanceCode.value) {
    attendanceCodeError.value = 'Por favor, ingresa o escanea el código de asistencia.';
    isSubmitting.value = false;
    return;
  }

  try {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    console.log('Formatted Date for attendance:', formattedDate);

    const attendanceCodeDocRef = doc(db, 'codigos_asistencia', props.classId, 'fechas', formattedDate);
    const codeDocSnap = await getDoc(attendanceCodeDocRef);

    if (!codeDocSnap.exists()) {
      console.warn('No attendance code document found for path:', attendanceCodeDocRef.path);
      message.value = 'No hay código de asistencia activo para esta clase hoy.';
      messageClass.value = 'bg-red-100 text-red-700';
      isSubmitting.value = false;
      return;
    }

    const codeData = codeDocSnap.data();
    console.log('Fetched attendance code data:', codeData);

    // Verificar si el código coincide y no ha expirado
    if (
      codeData?.code !== inputAttendanceCode.value ||
      (codeData?.expiresAt && codeData.expiresAt.toDate() < today)
    ) {
      console.warn('Code mismatch or expired. Input:', inputAttendanceCode.value, 'Stored:', codeData?.code, 'Expired:', codeData?.expiresAt?.toDate() < today);
      message.value = 'Código de asistencia incorrecto o ha expirado.';
      messageClass.value = 'bg-red-100 text-red-700';
      isSubmitting.value = false;
      return;
    }

    const attendanceDocRef = doc(db, 'asistencias', props.classId, 'dias', formattedDate);
    await setDoc(
      attendanceDocRef,
      {
        [studentUid]: { 
          status: 'Presente',
          timestamp: Timestamp.now(),
          markedBy: 'alumno',
        },
      },
      { merge: true }
    );

    message.value = '¡Asistencia marcada con éxito!';
    messageClass.value = 'bg-green-100 text-green-700';
    emit('attendance-marked');
    setTimeout(() => {
      closeModal(); // Usar la función closeModal para asegurar que el escáner se detenga
    }, 1500);
  } catch (error) {
    console.error('Error marking attendance:', error);
    message.value = 'Error al marcar asistencia. Inténtalo de nuevo.';
    messageClass.value = 'bg-red-100 text-red-700';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  // Inicializar el escáner QR cuando el componente se monta
  qrScanner.value = new Html5QrcodeScanner(
    "qr-reader",
    {
      fps: 10, // Frames por segundo
      qrbox: { width: 250, height: 250 }, // Tamaño del área de escaneo
      disableFlip: false, // Permitir escaneo de códigos espejados
      // supportedScanTypes is not available, so remove or comment this block
      // If you want to specify formats, use supportedFormats instead, e.g.:
      // supportedFormats: [Html5QrcodeSupportedFormats.QR_CODE],
    },
    /* verbose= */ false
  );
  qrScanner.value.render(onScanSuccess, onScanError);
  console.log("QR scanner initialized and rendered.");
});

onUnmounted(() => {
  // Asegúrate de detener el escáner cuando el componente se desmonte para liberar la cámara
  if (qrScanner.value) {
    qrScanner.value.clear().catch((err: any) => console.error("Error clearing QR scanner on unmount:", err));
    console.log("QR scanner cleared on unmount.");
  }
});
</script>

<style scoped>
/* No se necesitan estilos específicos, Tailwind maneja la mayoría. */
/* Asegúrate de que el contenedor #qr-reader tenga un tamaño definido para que la cámara se muestre */
#qr-reader video {
  max-width: 100%;
  height: auto;
  border-radius: inherit; /* Hereda el border-radius del padre */
}
</style>