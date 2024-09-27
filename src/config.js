import dotenv from "dotenv";

dotenv.config()

export default {
    PORT :  process.env.PORT || 3000,
    DB_HOST :  process.env.DB_HOST || 'localhost',
    DB_NAME :  process.env.DB_NAME,
    DB_USER :  process.env.DB_USER || 'root',
    DB_PASSWORD :  process.env.DB_PASSWORD,
    DB_PORT :  process.env.DB_PORT || 3306,
    FRONT_URL :  process.env.FRONT_URL,
}