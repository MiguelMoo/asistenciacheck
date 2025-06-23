<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
      <button
        @click="$emit('close')"
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Unirse a una Clase</h2>

      <div class="mb-4">
        <label for="joinCode" class="block text-sm font-medium text-gray-700 mb-1">
          Código de Clase:
        </label>
        <input
          type="text"
          id="joinCode"
          v-model="inputClassCode"
          placeholder="Ingresa el código de la clase"
          :class="{ 'border-red-500': classCodeError }"
          class="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p v-if="classCodeError" class="text-red-500 text-sm mt-1">{{ classCodeError }}</p>
      </div>

      <button
        @click="joinClass"
        :disabled="isSubmitting"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">Uniéndose...</span>
        <span v-else>Unirse a Clase</span>
      </button>

      <div v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md text-center">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'; // Import setDoc and getDoc

const emit = defineEmits(['close', 'class-joined']);

const auth = getAuth();
const db = getFirestore();

const inputClassCode = ref('');
const classCodeError = ref<string | null>(null);
const message = ref<string | null>(null);
const messageClass = ref<string>('');
const isSubmitting = ref(false);

const joinClass = async () => {
  classCodeError.value = null;
  message.value = null;
  messageClass.value = '';
  isSubmitting.value = true;

  const studentUid = auth.currentUser?.uid;
  if (!studentUid) {
    message.value = 'Debes iniciar sesión para unirte a una clase.';
    messageClass.value = 'bg-red-100 text-red-700';
    isSubmitting.value = false;
    return;
  }

  if (!inputClassCode.value) {
    classCodeError.value = 'Por favor, ingresa un código de clase.';
    isSubmitting.value = false;
    return;
  }

  try {
    const classesRef = collection(db, 'clases');
    const q = query(classesRef, where('codigoClase', '==', inputClassCode.value));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      message.value = 'Código de clase inválido o la clase no existe.';
      messageClass.value = 'bg-red-100 text-red-700';
      isSubmitting.value = false;
      return;
    }

    const classDoc = querySnapshot.docs[0];
    const classId = classDoc.id; 
    const classData = classDoc.data();

    const enrollmentDocRef = doc(db, 'clases', classId, 'alumnosInscritos', studentUid);
    const enrollmentSnap = await getDoc(enrollmentDocRef);

    if (enrollmentSnap.exists()) {
      message.value = 'Ya estás inscrito en esta clase.';
      messageClass.value = 'bg-yellow-100 text-yellow-700';
      isSubmitting.value = false;
      return;
    }

    await setDoc(enrollmentDocRef, {
      joinedAt: new Date(),
    });

    message.value = '¡Te has unido a la clase con éxito!';
    messageClass.value = 'bg-green-100 text-green-700';
    emit('class-joined');
    setTimeout(() => {
      emit('close');
    }, 1500);
  } catch (error) {
    console.error('Error al unirse a la clase:', error);
    message.value = 'Error al unirse a la clase. Inténtalo de nuevo.';
    messageClass.value = 'bg-red-100 text-red-700';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>

</style>