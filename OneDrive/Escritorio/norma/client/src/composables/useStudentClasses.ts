// composables/useStudentClasses.ts
import { ref } from 'vue';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Clase } from '../types/types'; // Ajusta la ruta a tu archivo types.ts

export function useStudentClasses() {
  const db = getFirestore();
  const auth = getAuth();

  const clasesAlumno = ref<Clase[]>([]);
  const loadingClasesAlumno = ref(false);
  const errorClasesAlumno = ref<string | null>(null);
  const showJoinClassModal = ref(false);
  const joinClassCode = ref('');
  const joining = ref(false);

  const cargarClasesAlumno = async () => {
    loadingClasesAlumno.value = true;
    errorClasesAlumno.value = null;
    clasesAlumno.value = [];
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado.');

      const q = query(collection(db, 'clases'), where('alumnosInscritos', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);

      const enrolledClasses = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Clase[];

      const classesWithProfesorNames = await Promise.all(
        enrolledClasses.map(async (clase) => {
          const profesorUid = clase.profesorUid;
          const profesorDoc = await getDoc(doc(db, 'usuarios', profesorUid));
          const nombreProfesor = profesorDoc.exists()
            ? profesorDoc.data()?.nombre || 'Desconocido'
            : 'Desconocido';
          return { ...clase, nombreProfesor };
        })
      );
      clasesAlumno.value = classesWithProfesorNames;
    } catch (e: any) {
      errorClasesAlumno.value = e.message || 'Error al cargar tus clases.';
    } finally {
      loadingClasesAlumno.value = false;
    }
  };

  const unirseAClase = async () => {
    joining.value = true;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado.');
      if (!joinClassCode.value) {
        alert('Por favor, ingresa un código de clase.');
        return false;
      }

      const classCode = joinClassCode.value.toUpperCase().trim();

      const q = query(collection(db, 'clases'), where('codigoClase', '==', classCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('Clase no encontrada. Verifica el código e inténtalo de nuevo.');
        return false;
      }

      const classDoc = querySnapshot.docs[0];
      const claseData = classDoc.data();
      const claseRef = doc(db, 'clases', classDoc.id);

      if (claseData.alumnosInscritos && claseData.alumnosInscritos.includes(user.uid)) {
        alert('Ya estás inscrito en esta clase.');
        showJoinClassModal.value = false;
        joinClassCode.value = '';
        return false;
      }

      await updateDoc(claseRef, {
        alumnosInscritos: arrayUnion(user.uid),
      });

      alert('¡Te has unido a la clase exitosamente!');
      showJoinClassModal.value = false;
      joinClassCode.value = '';
      await cargarClasesAlumno();
      return true;
    } catch (e: any) {
      alert('Error al unirte a la clase: ' + (e.message || e));
      return false;
    } finally {
      joining.value = false;
    }
  };

  return {
    clasesAlumno,
    loadingClasesAlumno,
    errorClasesAlumno,
    showJoinClassModal,
    joinClassCode,
    joining,
    cargarClasesAlumno,
    unirseAClase,
  };
}