require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database');
const AuditEvent = require('./models/AuditEvent');
const creditApplicationRoutes = require('./routes/creditApplicationRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'credit-application-service', timestamp: new Date() });
});

app.use('/api/credit-applications', creditApplicationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await AuditEvent.sync({ force: false });
    console.log('Conexión a Neon PostgreSQL establecida.');
    app.listen(PORT, () => {
      console.log(`credit-application-service corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servicio:', error);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
