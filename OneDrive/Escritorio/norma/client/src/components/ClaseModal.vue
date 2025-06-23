<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg max-w-3xl w-full p-6 relative shadow-lg max-h-[90vh] overflow-auto">
      <h3 class="text-2xl font-bold mb-6">
        {{ editando ? 'Editar Clase' : 'Clases - agregar clase' }}
      </h3>
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-medium text-sm mb-1">Nombre de la clase*</label>
            <input
              v-model="form.nombreClase"
              required
              class="w-full border px-3 py-2 rounded"
              placeholder="Nombre de la clase"
            />
          </div>
          <div>
            <label class="block font-medium text-sm mb-1">%mín asistencias*</label>
            <input
              v-model.number="form.minAsistencias"
              type="number"
              min="0"
              required
              class="w-full border px-3 py-2 rounded"
              placeholder="% min asistencias"
            />
          </div>
          <div>
            <label class="block font-medium text-sm mb-1">Grado y grupo</label>
            <div class="flex gap-2">
              <input
                v-model="form.grado"
                required
                class="w-full border px-3 py-2 rounded"
                placeholder="Grado"
              />
              <input
                v-model="form.grupo"
                required
                class="w-full border px-3 py-2 rounded"
                placeholder="Grupo"
              />
            </div>
          </div>
        </div>

        <div class="mt-4">
          <label class="block font-medium text-sm mb-1">Nombre de la carrera</label>
          <input
            v-model="form.nombreCarrera"
            required
            class="w-full border px-3 py-2 rounded"
            placeholder="Nombre de la carrera"
          />
        </div>

        <div class="mt-6">
          <p class="text-lg font-semibold mb-2">Escoge el horario de clases:</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="dia in diasSemana" :key="dia">
              <label class="block text-sm font-medium">{{ dia }}</label>
              <div class="flex gap-2">
                <select
                  v-model="form.horarios[dia].start"
                  class="w-1/2 border px-2 py-2 rounded"
                >
                  <option value="">No hay clase</option>
                  <option v-for="time in timeOptions" :key="time" :value="time">
                    {{ time }}
                  </option>
                </select>
                <select
                  v-model="form.horarios[dia].end"
                  class="w-1/2 border px-2 py-2 rounded"
                >
                  <option value="">No hay clase</option>
                  <option v-for="time in timeOptions" :key="time" :value="time">
                    {{ time }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            :disabled="saving"
          >
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useClasses } from '../composables/useClasses'; // Ajusta la ruta

const props = defineProps<{
  editando: boolean;
}>();

const emit = defineEmits(['close', 'saved']);

const { form, saving, diasSemana, guardarClase, resetFormulario } = useClasses();

const timeOptions = computed(() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
});

const handleSubmit = async () => {
  const success = await guardarClase();
  if (success) {
    emit('saved');
    emit('close');
  }
};
</script>