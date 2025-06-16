const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    const ip = req.query.ip;
    if (!ip) {
      return res.status(400).json({ error: 'Parámetro "ip" es requerido' });
    }
    console.log('IP recibida:', ip);

    const response = await fetch(`http://ip-api.com/json/${ip}?lang=es`);
    const data = await response.json();

    // Redondear y dejar como número, a 6 decimales
    if (data.lat && data.lon) {
      data.lat = Math.round(Number(data.lat) * 1e6) / 1e6;
      data.lon = Math.round(Number(data.lon) * 1e6) / 1e6;
    }
console.log('Datos de geolocalización:', data);
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo geolocalización:', error);
    res.status(500).json({ error: 'No se pudo obtener la ubicación' });
  }
});

module.exports = router;
