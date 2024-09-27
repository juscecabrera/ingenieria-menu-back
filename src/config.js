import dotenv from "dotenv";

dotenv.config()

export default {
    PORT :  process.env.PORT || 3000,
    DB_HOST :  process.env.DB_HOST || 'localhost',
    DB_NAME :  process.env.DB_NAME,
    DB_USER :  process.env.DB_USER || 'root',
    DB_PASSWORD :  process.env.DB_PASSWORD,
    DB_PORT :  process.env.DB_PORT || 3306,
    // PDF_DATA_URL: process.env.PDF_DATA_URL,
    // MONGO_URI: process.env.MONGO_URI,
    // MONGO_SECRET: process.env.MONGO_SECRET,
    // FTP_USER: process.env.FTP_USER,
    // FTP_PASSWORD: process.env.FTP_PASSWORD,
    // FTP_SERVER: process.env.FTP_SERVER,
    // FTP_PDF_URL: process.env.FTP_PDF_URL,
    // FRONT_URL: process.env.FRONT_URL
}