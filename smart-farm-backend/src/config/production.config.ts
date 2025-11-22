export const productionConfig = {
  port: 3000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    username: process.env.DATABASE_USERNAME || 'smartfarm',
    password: process.env.DATABASE_PASSWORD || 'smartfarm_password',
    database: process.env.DATABASE_NAME || 'smartfarm_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  },
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://your-mqtt-broker.com',
    username: process.env.MQTT_USERNAME || 'your-mqtt-username',
    password: process.env.MQTT_PASSWORD || 'your-mqtt-password',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'error',
  },
};
