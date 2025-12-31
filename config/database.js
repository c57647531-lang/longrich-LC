import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },

  sync: {
    force: false,    // false = ne supprime PAS les tables existantes
    alter: false      // true = MODIFIE les tables existantes
  }
};

// Render DATABASE_URL ou Local
// Une version plus robuste dans votre fichier sequelize.js
const connectionString = (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@host/')) 
  ? process.env.DATABASE_URL 
  : `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, config);

export default sequelize;
