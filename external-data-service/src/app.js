require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./config/database');
const externalDataRoutes = require('./routes/externalDataRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { getBreakerStatus } = require('./simulators/creditBureauSimulator');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'external-data-service',
    timestamp: new Date(),
    circuit_breaker: getBreakerStatus(),
  });
});

app.use('/api/external-data', externalDataRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a Neon PostgreSQL establecida.');
    app.listen(PORT, () => {
      console.log(`external-data-service corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servicio:', error);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
