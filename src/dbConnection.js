import { Sequelize } from "sequelize";
import config from "./config.js";

const customLogger = (msg) => {
    // Personaliza la salida aquí
    if (msg.includes('SELECT')) {
        console.log('SELECT query executed.');
    } else if (msg.includes('INSERT')) {
        console.log('INSERT query executed.');
    } else {
        console.log('Other query executed.');
    }
};

const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
    host: config.DB_HOST,
    dialect: 'mysql',
    port: config.DB_PORT,
    logging: customLogger
})

try {
    await sequelize.authenticate();
    console.log("Connection to the MySQL database has been established succesfully.");
    
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

export default sequelize;