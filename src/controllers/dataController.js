import { Sequelize, Op, and } from "sequelize";
import config from "../config.js";
import Plato from "../dao/models/Plate.js";
import convertToMonthYear from "../utils/convertToMonthYear.js";
import { omnesFunction } from './informesFunctions/informesFunctions.js'
// import { omnesFunction } from "./informesFunctions.js/informesFunctions.js";

// await sequelize.authenticate();

//READ - Conseguir todos los platos
export const getPlates = async (req, res) => {
    try {
        const plates = await Plato.findAll();
        res.status(200).json(plates);
      } catch (err) {
        res.status(500).json({ error: 'Error fetching plates.' });
      }
}

//READ - Conseguir plato por ID
export const getPlatesById = async (req, res) => {
    const { id } = req.params;
    try {
      const plate = await Plato.findByPk(id);
      if (plate) {
        res.status(200).json(plate);
      } else {
        res.status(404).json({ error: 'Plate not found.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching plate.' });
    }
}

//CREATE - Crear un nuevo plato
export const createPlates = async (req, res) => {
    const { Mes_plato, Categoria_plato, Nombre_plato, Cantidad_vendida_plato, Precio_plato, Costo_plato, Dias_plato } = req.body;

    //Precio de venta / (1 + (IGV + Rec)) = Valor de venta
    
    const mesFormat = convertToMonthYear(Mes_plato)

    const IGV = 0.18
    const Rec_consumo = 0.10

    const valorVenta = Precio_plato / (1 + (IGV + Rec_consumo))

    try {
        // Crea un nuevo registro en la tabla Platos
        const newPlate = await Plato.create({
            Mes_plato: mesFormat,
            Categoria: Categoria_plato,
            Nombre: Nombre_plato,
            Cantidad_vendida: Cantidad_vendida_plato,
            Valor_Venta: valorVenta,
            Precio: Precio_plato,
            Costo: Costo_plato,
            Dias_en_carta: Dias_plato,
            Con_IVA: true,
            Con_Rec: true
        });

        // Envía una respuesta exitosa con el nuevo registro
        res.status(201).json(newPlate);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating plate.' });
    }
};

//por testear
export const updatePlate = async (req, res) => {
    const { id } = req.params;
    const { name, category, price } = req.body;
    try {
        const plate = await Plato.findByPk(id);
        if (plate) {
        plate.name = name;
        plate.category = category;
        plate.price = price;
        await plate.save();
        res.status(200).json({ message: 'Plate updated successfully.' });
        } else {
        res.status(404).json({ error: 'Plate not found.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating plate.' });
    }
}

//por testear
export const deletePlate = async (req, res) => { 
    const { id } = req.params;
    try {
        const plate = await Plato.findByPk(id);
        if (plate) {
        await plate.destroy();
        res.status(200).json({ message: 'Plate deleted successfully.' });
        } else {
        res.status(404).json({ error: 'Plate not found.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error deleting plate.' });
    }
}

export const createInforms = async (req, res) => {
    const { Informes_Mes, Informes_Categoria } = req.body

    const mesFormat = convertToMonthYear(Informes_Mes)

    //mesFormat = Mar-2024, Informes_Categoria = FONDOS

    //aqui debe estar toda la logica para crear los informes

    const omnesResult = await omnesFunction(mesFormat, Informes_Categoria)

    try {
        console.log(omnesResult);        
    } catch (error) {
        res.status(500).json({ error: 'Error creating inform.' });
    }
}