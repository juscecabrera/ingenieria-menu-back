import { DataTypes } from "sequelize";
import sequelize from '../../dbConnection.js'

const Plato = sequelize.define('Plato', {
  Codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Mes_plato: {
    type: DataTypes.STRING, // Solo almacena la fecha (año, mes, día)
    allowNull: false
  },
  Categoria: {
    type: DataTypes.STRING(100), // Almacena hasta 100 caracteres
    allowNull: false
  },
  Nombre: {
    type: DataTypes.STRING(255), // Almacena hasta 255 caracteres
    allowNull: false
  },
  Cantidad_vendida: {
    type: DataTypes.INTEGER, // Número entero
    allowNull: false
  },
  Valor_Venta: {  
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false, // Puedes cambiar a false si es obligatorio
  },
  Precio: {
    type: DataTypes.DECIMAL(10, 2), // Hasta 10 dígitos y 2 decimales
    allowNull: false
  },
  Costo: {
    type: DataTypes.DECIMAL(10, 2), // Hasta 10 dígitos y 2 decimales
    allowNull: false
  },
  Dias_en_carta: {
    type: DataTypes.INTEGER, // Número entero
    allowNull: false
  },
  Con_IVA: {
    type: DataTypes.BOOLEAN, // Booleano para indicar si tiene IVA
    allowNull: false
  },
  Con_Rec: {
    type: DataTypes.BOOLEAN, // Booleano para indicar si tiene recargo
    allowNull: false
  }
}, {
  tableName: 'Platos', // Nombre de la tabla en la base de datos
  timestamps: false // Desactiva las columnas `createdAt` y `updatedAt` si no las necesitas
});

export default Plato;