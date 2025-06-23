<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
      <h3 class="text-2xl font-bold mb-4">Unirse a una clase</h3>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block font-medium text-sm mb-1">Código de la clase</label>
          <input
            v-model="joinClassCode"
            type="text"
            required
            class="w-full border px-3 py-2 rounded text-center text-lg font-mono tracking-widest uppercase"
            placeholder="EJ: ABC123"
            maxlength="6"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            :disabled="joining"
          >
            {{ joining ? 'Uniéndose...' : 'Unirse' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStudentClasses } from '../composables/useStudentClasses'; // Ajusta la ruta

const emit = defineEmits(['close', 'joined']);

const { joinClassCode, joining, unirseAClase } = useStudentClasses();

const handleSubmit = async () => {
  const success = await unirseAClase();
  if (success) {
    emit('joined');
    emit('close');
  }
};
</script>