import { Sequelize, Op, and } from "sequelize";
import config from "../config.js";
import Plate from "../dao/models/Plate.js";

// await sequelize.authenticate();

//READ - Conseguir todos los platos
export const getPlates = async (req, res) => {
    try {
        // const plates = await Plate.findAll();
        const plates = {'Plato 1': 10}
        res.status(200).json(plates);
      } catch (err) {
        res.status(500).json({ error: 'Error fetching plates.' });
      }
}

//READ - Conseguir plato por ID
export const getPlatesById = async (req, res) => {
    const { id } = req.params;
    try {
      const plate = await Plate.findByPk(id);
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
//Cambiar el req.body como sea necesario
export const createPlates = async (req, res) => {
    // const { CodInt, Mes_plato, Categoria_plato, Nombre_plato, Cantidad_vendida_plato, Precio_plato, Costo_plato, Dias_plato   } = req.body;


    try {
        // const newPlate = await Plate.create({ name, category, price });
        console.log(req.body);
        // res.status(201).json(newPlate);
    } catch (err) {
        res.status(500).json({ error: 'Error creating plate.' });
    }
}

export const updatePlate = async (req, res) => {
    const { id } = req.params;
    const { name, category, price } = req.body;
    try {
        const plate = await Plate.findByPk(id);
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

export const deletePlate = async (req, res) => {
    const { id } = req.params;
    try {
        const plate = await Plate.findByPk(id);
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