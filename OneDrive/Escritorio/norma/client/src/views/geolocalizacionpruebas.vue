<template>
    <div class="container mt-5">
        <div class="card p-4 shadow">
            <h2 class="text-center">Geolocalización del usuario</h2>
            <button class="btn btn-primary w-100 mt-3" @click="consultarUbicacion">Obtener ubicación</button>

            <div v-if="ubicacion" class="mt-4">
                <p><strong>IP:</strong> {{ ubicacion.query }}</p>
                <p><strong>Ciudad:</strong> {{ ubicacion.city }}</p>
                <p><strong>Región:</strong> {{ ubicacion.regionName }}</p>
                <p><strong>País:</strong> {{ ubicacion.country }}</p>
                <p><strong>Latitud:</strong> {{ ubicacion.lat }}</p>
                <p><strong>Longitud:</strong> {{ ubicacion.lon }}</p>

                <div id="map" style="height: 300px;" class="mt-4"></div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, watch, nextTick } from 'vue';
import { obtenerIPCliente } from '../services/ipService';
import { api } from '../services/api';
import L from 'leaflet';

// Donde se guarda la ubicación obtenida
const ubicacion = ref(null);
// Referencia al mapa Leaflet
let mapInstance = null;

async function consultarUbicacion() {
    const ip = await obtenerIPCliente();
    if (!ip) return;
    console.log(`Consultando ubicación para la IP: ${ip.ip}`);
    const res = await api.get(`/ubicacion-ip?ip=${ip.ip}`);
    ubicacion.value = res.data;
}

watch(ubicacion, async (nuevaUbicacion) => {
    if (!nuevaUbicacion) return;

    const { lat, lon } = nuevaUbicacion;

    // Esperar a que #map exista en el DOM
    await nextTick();

    // Destruye mapa previo si existe
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Crea el mapa centrado en la ubicación
    mapInstance = L.map('map').setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Coloca un marcador en la ubicación detectada
    L.marker([lat, lon]).addTo(mapInstance)
        .bindPopup('Ubicación aproximada')
        .openPopup();
});
</script>
