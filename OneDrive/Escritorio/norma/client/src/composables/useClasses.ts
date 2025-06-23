import { ref, reactive } from 'vue';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Clase } from '../types/types';

export function useClasses() {
  const db = getFirestore();
  const auth = getAuth();

  const clases = ref<Clase[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const saving = ref(false);
  const editando = ref(false);
  const claseEnEdicionId = ref<string | null>(null);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sabado'];

  const form = reactive<Omit<Clase, 'id' | 'codigoClase' | 'profesorUid' | 'creadoEn' | 'alumnosInscritos'>>({
    nombreClase: '',
    minAsistencias: 0,
    grado: '',
    grupo: '',
    nombreCarrera: '',
    horarios: diasSemana.reduce((acc, dia) => {
      acc[dia] = '';
      return acc;
    }, {} as Record<string, string>),
  });

  const generarCodigoClase = (length = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < length; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  };

  const cargarClases = async () => {
    loading.value = true;
    error.value = null;
    clases.value = [];
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado.');
      const q = query(collection(db, 'clases'), where('profesorUid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      clases.value = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Clase));
    } catch (e: any) {
      error.value = e.message || 'Error al cargar clases.';
    } finally {
      loading.value = false;
    }
  };

  const guardarClase = async () => {
    saving.value = true;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado.');

      const horariosParaGuardar: Record<string, string> = {};
      let hasValidHorario = false;

      for (const dia of diasSemana) {
        const horario = form.horarios[dia];
        if (horario) {
          const [start, end] = horario.split('-');
          if (!start || !end) {
            alert(`Por favor, completa ambos campos de hora para ${dia}.`);
            saving.value = false;
            return;
          }
          if (start >= end) {
            alert(`La hora de inicio para ${dia} debe ser anterior a la de fin.`);
            saving.value = false;
            return;
          }
          horariosParaGuardar[dia] = `${start}-${end}`;
          hasValidHorario = true;
        }
      }

      if (!hasValidHorario) {
        alert('Debes ingresar al menos un horario válido.');
        saving.value = false;
        return;
      }

      if (editando.value && claseEnEdicionId.value) {
        const claseRef = doc(db, 'clases', claseEnEdicionId.value);
        await updateDoc(claseRef, {
          nombreClase: form.nombreClase,
          minAsistencias: form.minAsistencias,
          grado: form.grado,
          grupo: form.grupo,
          nombreCarrera: form.nombreCarrera,
          horarios: horariosParaGuardar,
        });
        alert('Clase actualizada correctamente.');
      } else {
        let codigo;
        let exists = true;
        while (exists) {
          codigo = generarCodigoClase();
          const q = query(collection(db, 'clases'), where('codigoClase', '==', codigo));
          const snap = await getDocs(q);
          exists = !snap.empty;
        }

        const nuevaClase: Clase = {
          codigoClase: codigo!,
          nombreClase: form.nombreClase,
          minAsistencias: form.minAsistencias,
          grado: form.grado,
          grupo: form.grupo,
          nombreCarrera: form.nombreCarrera,
          horarios: horariosParaGuardar,
          profesorUid: user.uid,
          creadoEn: new Date(),
          alumnosInscritos: [],
        };

        await addDoc(collection(db, 'clases'), nuevaClase);
        await navigator.clipboard.writeText(codigo!);
        alert(`Clase creada con código: ${codigo} (copiado al portapapeles)`);
      }

      resetFormulario();
      await cargarClases();
      return true;
    } catch (e: any) {
      alert('Error guardando clase: ' + (e.message || e));
      return false;
    } finally {
      saving.value = false;
    }
  };

  const resetFormulario = () => {
    form.nombreClase = '';
    form.minAsistencias = 0;
    form.grado = '';
    form.grupo = '';
    form.nombreCarrera = '';
    diasSemana.forEach((d) => {
      form.horarios[d] = '';
    });
    editando.value = false;
    claseEnEdicionId.value = null;
  };

  const editarClase = (clase: Clase) => {
    form.nombreClase = clase.nombreClase;
    form.minAsistencias = clase.minAsistencias;
    form.grado = clase.grado;
    form.grupo = clase.grupo;
    form.nombreCarrera = clase.nombreCarrera;
    diasSemana.forEach((d) => {
      form.horarios[d] = clase.horarios?.[d] || '';
    });
    claseEnEdicionId.value = clase.id!;
    editando.value = true;
  };

  return {
    clases,
    loading,
    error,
    saving,
    editando,
    form,
    diasSemana,
    cargarClases,
    guardarClase,
    resetFormulario,
    editarClase,
  };
}
export type { Clase } from '../types/types';