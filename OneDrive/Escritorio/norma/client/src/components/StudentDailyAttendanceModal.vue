<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
      <button
        @click="$emit('close')"
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">
        Asistencia Diaria de {{ studentName }}
      </h2>
      <p class="text-md text-gray-600 mb-6 text-center">
        Periodo: {{ startDate.toLocaleDateString('es-ES') }} - {{ endDate.toLocaleDateString('es-ES') }}
      </p>

      <div v-if="loadingDailyAttendance" class="text-gray-500 text-center py-8">
        Cargando asistencia diaria...
      </div>
      <div v-else-if="dailyAttendanceRecords.length === 0" class="text-gray-500 text-center py-8">
        No hay registros de asistencia para este alumno en el periodo seleccionado o no hubo días hábiles.
      </div>
      <div v-else class="overflow-y-auto max-h-96 border rounded-lg">
        <table class="min-w-full bg-white">
          <thead class="sticky top-0 bg-gray-100">
            <tr>
              <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in dailyAttendanceRecords" :key="record.date" class="hover:bg-gray-50">
              <td class="py-2 px-4 border-b text-sm text-gray-800">{{ new Date(record.date).toLocaleDateString('es-ES') }}</td>
              <td class="py-2 px-4 border-b text-sm">
                <span
                  :class="{
                    'bg-green-100 text-green-800': record.status === 'Presente',
                    'bg-red-100 text-red-800': record.status === 'Ausente',
                    'bg-yellow-100 text-yellow-800': record.status === 'Tardanza',
                  }"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ record.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-gray-500 mt-4">
        Solo se muestran los días que cumplen con los criterios de días hábiles (lunes a viernes) del periodo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const props = defineProps<{
  classId: string;
  studentUid: string;
  studentName: string;
  startDate: Date;
  endDate: Date;
}>();

const emit = defineEmits(['close']);

const db = getFirestore();
const dailyAttendanceRecords = ref<{ date: string; status: 'Presente' | 'Ausente' | 'Tardanza' }[]>([]);
const loadingDailyAttendance = ref(true);

const loadDailyAttendance = async () => {
  loadingDailyAttendance.value = true;
  dailyAttendanceRecords.value = [];

  const records: { date: string; status: 'Presente' | 'Ausente' | 'Tardanza' }[] = [];

  try {
    const attendanceDocsRef = collection(db, 'asistencias', props.classId, 'dias');
    const querySnapshot = await getDocs(attendanceDocsRef);
    const attendanceMap: { [date: string]: 'Presente' | 'Ausente' | 'Tardanza' } = {};
    querySnapshot.forEach(docSnap => {
      const attendanceData = docSnap.data();
      const attendanceDateStr = docSnap.id; 
      if (attendanceData[props.studentUid]) {
        attendanceMap[attendanceDateStr] = attendanceData[props.studentUid].status;
      }
    });
    let currentDate = new Date(props.startDate);
    currentDate.setHours(0, 0, 0, 0); 

    const endDateNormalized = new Date(props.endDate);
    endDateNormalized.setHours(23, 59, 59, 999); 

    while (currentDate <= endDateNormalized) {
      const dayOfWeek = currentDate.getDay(); 
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const formattedDate = currentDate.toISOString().split('T')[0];

        records.push({
          date: formattedDate,
          status: attendanceMap[formattedDate] || 'Ausente', 
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dailyAttendanceRecords.value = records.sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Error al cargar la asistencia diaria del alumno:', error);
  } finally {
    loadingDailyAttendance.value = false;
  }
};

watch(() => [props.classId, props.studentUid, props.startDate, props.endDate], () => {
  loadDailyAttendance();
}, { deep: true });


onMounted(() => {
  loadDailyAttendance();
});
</script>

<style scoped>

</style>