import { ref, reactive } from "vue";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Clase, Horarios } from "../types/types";
import Swal from "sweetalert2";
import {
  isValidText,
  isValidNumber,
  sanitize,
  isValidTextNumbre,
} from "../utils/validators";

export function useClasses() {
  const db = getFirestore();
  const auth = getAuth();

  const clases = ref<Clase[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const saving = ref(false);
  const editando = ref(false);
  const claseEnEdicionId = ref<string | null>(null);

  const form = reactive<
    Omit<
      Clase,
      "id" | "codigoClase" | "profesorUid" | "creadoEn" | "alumnosInscritos"
    >
  >({
    nombreClase: "",
    minAsistencias: 0,
    grado: "",
    grupo: "",
    nombreCarrera: "",
    horarios: {
      Lunes: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
      Martes: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
      Miércoles: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
      Jueves: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
      Viernes: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
      Sabado: {
        start: "",
        end: "",
        split: function (): [any, any] {
          throw new Error("Function not implemented.");
        },
      },
    },
  });

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ];

  const generarCodigoClase = (length = 6): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
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
      if (!user) throw new Error("Usuario no autenticado.");
      const q = query(
        collection(db, "clases"),
        where("profesorUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      clases.value = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Clase)
      );
    } catch (e: any) {
      error.value = e.message || "Error al cargar clases.";
    } finally {
      loading.value = false;
    }
  };

  const guardarClase = async () => {
    saving.value = true;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      form.nombreClase = sanitize(form.nombreClase);
      form.nombreCarrera = sanitize(form.nombreCarrera);
      form.grado = sanitize(form.grado);
      form.grupo = sanitize(form.grupo);

      // Validar nombreClase
      if (!isValidTextNumbre(form.nombreClase)) {
        Swal.fire(
          "Campo inválido",
          "El nombre de la clase debe contener solo letras.",
          "warning"
        );
        saving.value = false;
        return false;
      }

      // Validar nombreCarrera
      if (!isValidText(form.nombreCarrera)) {
        Swal.fire(
          "Campo inválido",
          "El nombre de la carrera debe contener solo letras.",
          "warning"
        );
        saving.value = false;
        return false;
      }

      // Validar minAsistencias
      if (
        !isValidNumber(String(form.minAsistencias)) ||
        form.minAsistencias < 1 ||
        form.minAsistencias > 100
      ) {
        Swal.fire(
          "Valor inválido",
          "El porcentaje mínimo debe ser un número entre 1 y 100.",
          "warning"
        );
        saving.value = false;
        return false;
      }

      // Validar grado: un solo número
      if (!isValidNumber(form.grado) || String(form.grado).length !== 1) {
        Swal.fire(
          "Grado inválido",
          'Debe ser un solo número (ej. "3").',
          "warning"
        );
        saving.value = false;
        return false;
      }

      // Validar grupo: una sola letra
      if (!/^[A-Za-z]$/.test(form.grupo)) {
        Swal.fire(
          "Grupo inválido",
          'Debe ser una sola letra (ej. "A").',
          "warning"
        );
        saving.value = false;
        return false;
      }
  console.log('[DEBUG] Horarios recibidos desde form:', JSON.stringify(form.horarios, null, 2));

      const horariosParaGuardar: {
        [key: string]: {
          start: string;
          end: string;
          split: (arg0: string) => [any, any];
        };
      } = {};
      let hasValidHorario = false;

      for (const dia of diasSemana) {
        const { start, end } = form.horarios[dia];

        
        if (start && end) {
          if (start >= end) {
            Swal.fire({
              icon: "error",
              title: "Error en horario",
              html: `Por favor, asegúrate de que la <strong>hora de inicio</strong> para <strong>${dia}</strong> sea anterior a la <strong>hora de fin</strong>.`,
              confirmButtonColor: "#3085d6",
              confirmButtonText: "Ok",
            });

            saving.value = false;
            return;
          }
          console.log(`[DEBUG] Guardando horario para ${dia}: ${start} - ${end}`);
          horariosParaGuardar[dia] = {
            start,
            end,
            split: function (arg0: string): [any, any] {
              return (start + "-" + end).split(arg0) as [any, any];
            },
          };
          hasValidHorario = true;
        } else if (start || end) {
          Swal.fire({
            icon: "warning",
            title: "Horario incompleto",
            html: `Selecciona <strong>ambas horas</strong> para <strong>${dia}</strong>, o deja ambas como <em>"No hay clase"</em>.`,
            confirmButtonText: "Ok",
          });

          saving.value = false;
          return;
        }
      }

      if (!hasValidHorario) {
        Swal.fire({
          icon: "warning",
          title: "Horario incompleto",
          html: "Debes ingresar al menos <strong>un horario válido</strong> (hora de inicio y fin).",
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Ok",
        });

        saving.value = false;
        return;
      }

      if (editando.value && claseEnEdicionId.value) {
        const claseRef = doc(db, "clases", claseEnEdicionId.value);
        await updateDoc(claseRef, {
          nombreClase: form.nombreClase,
          minAsistencias: form.minAsistencias,
          grado: form.grado,
          grupo: form.grupo,
          nombreCarrera: form.nombreCarrera,
          horarios: horariosParaGuardar,
        });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Clase actualizada correctamente.",
          confirmButtonText: "Aceptar",
        });
      } else {
        let codigo;
        let exists = true;
        while (exists) {
          codigo = generarCodigoClase();
          const q = query(
            collection(db, "clases"),
            where("codigoClase", "==", codigo)
          );
          const snap = await getDocs(q);
          exists = !snap.empty;
        }
console.log(horariosParaGuardar)
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

        await addDoc(collection(db, "clases"), nuevaClase);
        await navigator.clipboard.writeText(codigo!);
        Swal.fire({
          icon: "success",
          title: "Clase creada",
          text: `Clase creada con código: ${codigo} (copiado al portapapeles)`,
          confirmButtonText: "Entendido",
        });
      }

      resetFormulario();
      await cargarClases();
      return true;
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar la clase",
        text: `Detalles: ${e.message || e}`,
        confirmButtonText: "Cerrar",
      });
      return false;
    } finally {
      saving.value = false;
    }
  };

  const resetFormulario = () => {
    form.nombreClase = "";
    form.minAsistencias = 0;
    form.grado = "";
    form.grupo = "";
    form.nombreCarrera = "";
    diasSemana.forEach((d) => {
      form.horarios[d] = {
        start: "",
        end: "",
        split: function (arg0: string): [any, any] {
          throw new Error("Function not implemented.");
        },
      };
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
      const horarioStr = clase.horarios?.[d] || "";
      if (horarioStr) {
        const [start, end] = horarioStr.split("-");
        form.horarios[d] = {
          start: start || "",
          end: end || "",
          split: function (arg0: string): [any, any] {
            return ((start || "") + "-" + (end || "")).split(arg0) as [
              any,
              any
            ];
          },
        };
      } else {
        form.horarios[d] = {
          start: "",
          end: "",
          split: function (arg0: string): [any, any] {
            throw new Error("Function not implemented.");
          },
        };
      }
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
