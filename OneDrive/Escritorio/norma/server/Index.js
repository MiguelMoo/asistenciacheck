const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const ipRoute = require('./routes/obtenerUbicacion');

app.use(cors());
app.use(bodyParser.json());

app.use('/api/ubicacion-ip', ipRoute);

app.listen(3000, () => {
  console.log('Servidor Express escuchando en puerto 3000');
});
