<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
      <button
        @click="$emit('close')"
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

      <div class="mb-6">
        <label for="attendanceCode" class="block text-sm font-medium text-gray-700 mb-1">
          Código de Asistencia Temporal:
        </label>
        <input
          type="text"
          id="attendanceCode"
          v-model="inputAttendanceCode"
          placeholder="Ingresa el código que te dio el profesor"
          :class="{ 'border-red-500': attendanceCodeError }"
          class="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p v-if="attendanceCodeError" class="text-red-500 text-sm mt-1">{{ attendanceCodeError }}</p>
      </div>

      <button
        @click="submitAttendance"
        :disabled="isSubmitting"
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
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const props = defineProps<{
  classId: string;
  classCode: string; // The static code for the class (e.g., 'GX8n3ChttiKnsx1JWLOp')
}>();

const emit = defineEmits(['close', 'attendance-marked']);

const auth = getAuth();
const db = getFirestore();

const inputClassCode = ref(props.classCode); // This will display the static class code
const inputAttendanceCode = ref(''); // For the temporary code entered by the student
const attendanceCodeError = ref<string | null>(null);
const message = ref<string | null>(null);
const messageClass = ref<string>('');
const isSubmitting = ref(false);

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

  // --- DEBUGGING LOGS (keeping them for now as they might still be useful) ---
  console.log('--- MarkAttendanceModal Debug ---');
  console.log('Current User UID:', studentUid);
  console.log('Class ID received (props.classId):', props.classId);
  // --- END DEBUGGING LOGS ---

  if (!inputAttendanceCode.value) {
    attendanceCodeError.value = 'Por favor, ingresa el código de asistencia.';
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
      emit('close'); 
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

});
</script>

<style scoped>

</style>