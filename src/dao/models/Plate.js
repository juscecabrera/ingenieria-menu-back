import { DataTypes } from "sequelize";
import sequelize from '../../dbConnection.js'

//Esto es un test, pero cambiarlo a lo que necesitamos
const Plate = sequelize.define('Plate', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    tableName: 'plates',  // Nombre de la tabla
    timestamps: false     // Deshabilitar timestamps automáticos
  });
  
  export default Plate;