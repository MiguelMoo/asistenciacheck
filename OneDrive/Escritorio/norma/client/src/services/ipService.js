export async function obtenerIPCliente() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error al obtener IP del cliente:', error);
    return null;
  }
}
