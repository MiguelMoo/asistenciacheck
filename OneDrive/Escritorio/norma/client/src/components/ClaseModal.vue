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
              class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de la clase"
            />
            <p v-if="!form.nombreClase" class="text-red-500 text-xs mt-1">Este campo es obligatorio.</p>
          </div>

          <div>
            <label class="block font-medium text-sm mb-1">% mín asistencias*</label>
            <input
              v-model.number="form.minAsistencias"
              type="number"
              min="0"
              required
              class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="% min asistencias"
            />
            <p v-if="form.minAsistencias < 0" class="text-red-500 text-xs mt-1">No puede ser negativo.</p>
          </div>

          <div>
            <label class="block font-medium text-sm mb-1">Grado y grupo*</label>
            <div class="flex gap-2">
              <input
                v-model="form.grado"
                required
                class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Grado"
              />
              <input
                v-model="form.grupo"
                required
                class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Grupo"
              />
            </div>
            <p v-if="!form.grado || !form.grupo" class="text-red-500 text-xs mt-1">Ambos campos son obligatorios.</p>
          </div>
        </div>

        <div class="mt-4">
          <label class="block font-medium text-sm mb-1">Nombre de la carrera*</label>
          <input
            v-model="form.nombreCarrera"
            required
            class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la carrera"
          />
          <p v-if="!form.nombreCarrera" class="text-red-500 text-xs mt-1">Este campo es obligatorio.</p>
        </div>

        <div class="mt-6">
          <p class="text-lg font-semibold mb-2">Escoge el horario de clases:</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="dia in diasSemana" :key="dia">
              <label class="block text-sm font-medium">{{ dia }}</label>
              <div class="flex gap-2">
                <select
                  v-model="horariosUI[dia].start"
                  class="w-1/2 border px-2 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">No hay clase</option>
                  <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                </select>
                <select
                  v-model="horariosUI[dia].end"
                  class="w-1/2 border px-2 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">No hay clase</option>
                  <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                </select>
              </div>
              <p
                v-if="
                  (horariosUI[dia].start && !horariosUI[dia].end) ||
                  (!horariosUI[dia].start && horariosUI[dia].end)
                "
                class="text-red-500 text-xs mt-1"
              >
                Ambos campos deben estar completos o vacíos.
              </p>
              <p
                v-if="horariosUI[dia].start && horariosUI[dia].end && horariosUI[dia].start >= horariosUI[dia].end"
                class="text-red-500 text-xs mt-1"
              >
                La hora de inicio debe ser anterior a la de fin.
              </p>
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
import { computed, reactive, watch } from 'vue';
import { useClasses } from '../composables/useClasses';

const props = defineProps<{ editando: boolean }>();
const emit = defineEmits(['close', 'saved']);

const { form, saving, diasSemana, guardarClase } = useClasses();

const horariosUI = reactive<Record<string, { start: string; end: string }>>({});

diasSemana.forEach((dia) => {
  horariosUI[dia] = { start: '', end: '' };
});

watch(
  () => form.horarios,
  (horarios) => {
    diasSemana.forEach((dia) => {
      if (horarios[dia]) {
        const [start, end] = horarios[dia].split('-');
        horariosUI[dia] = { start, end };
      } else {
        horariosUI[dia] = { start: '', end: '' };
      }
    });
  },
  { immediate: true }
);

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
  let valid = true;

  // Validar horarios y convertir a string
  diasSemana.forEach((dia) => {
    const { start, end } = horariosUI[dia];
    if ((start && !end) || (!start && end)) {
      valid = false;
      return;
    }
    if (start && end && start >= end) {
      valid = false;
      return;
    }
    if (start && end) {
      form.horarios[dia] = `${start}-${end}`;
    } else {
      form.horarios[dia] = '';
    }
  });

  // Convertir grupo a mayúsculas antes de guardar
  form.grupo = form.grupo.toUpperCase();

  if (!valid) {
    alert('Corrige los errores en los horarios antes de guardar.');
    return;
  }

  const success = await guardarClase();
  if (success) {
    emit('saved');
    emit('close');
  }
};
</script>
