import { DataTypes } from 'sequelize';
import sequelize from '../../dbConnection.js'

const Costos = sequelize.define('Gastos', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Sueldo_Cocina: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Sueldo_Servicio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Sueldo_Administrativos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Alquiler: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Depreciacion: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Servicios_basicos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Publicidad: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Internet: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Otros: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Puedes cambiar a false si es necesario
    },
    Mes: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Costos', // Nombre de la tabla en la base de datos
    timestamps: false // Cambiar a true si deseas que Sequelize maneje las marcas de tiempo
});

export default Costos;
