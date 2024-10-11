import { and, Sequelize, Op } from "sequelize";
import config from "../config.js";
import Plato from "../dao/models/Plate.js";
import convertToMonthYear from "../utils/convertToMonthYear.js";
import { omnesFunction, BCGPop, ADL, IRP, IndexPopularidad, CostoMargenAnalysis, Miller, multiCriterioFunction, multiCriterioResultsOnly, PuntoEquilibrio, Uman, Merrick, executeInform } from './informesFunctions/informesFunctions.js'


//READ - Conseguir todos los platos
export const getPlates = async (req, res) => {
    const { mesPlato, yearPlato, categoria } = req.query;

    try {
        
        const queryOptions = {};
        let dateFilter;

        // Manejo de los diferentes casos según el mesPlato y yearPlato
        if (mesPlato !== undefined && mesPlato !== null) {
            if (yearPlato !== undefined && yearPlato !== null) {
                // Si hay mes y año: tener el formato Mes-Year (Ej: Ene-2021)
                dateFilter = `${mesPlato}-${yearPlato}`;
            } else {
                // Si hay mes pero no hay año: tener el formato Mes-*, es decir, cualquier año
                dateFilter = `${mesPlato}-%`;  // Usar '%' para coincidir con cualquier año en SQL
            }
        } else {
            if (yearPlato !== undefined && yearPlato !== null) {
                dateFilter = `%-${yearPlato}`;  // Usar '%' para coincidir con cualquier mes en SQL
            }
            // Si no hay mes pero hay año: tener el formato *-Year, es decir, cualquier mes
        }

        // Agregar el filtro de fecha si se ha generado uno
        if (dateFilter) {
            queryOptions.Mes_plato = {
                [Op.like]: dateFilter  // Usar el operador Sequelize 'like' para permitir comodines ('%')
            };
        }

        // Agregar el filtro de categoría si existe
        if (categoria) {
            queryOptions.Categoria = categoria;  
        }

        console.log(queryOptions);
        
        // Consulta a la base de datos con los filtros generados
        const plates = await Plato.findAll({
            where: queryOptions
        });

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

    
    let mesFormat
    try {
        mesFormat = convertToMonthYear(Mes_plato)
        console.log(mesFormat);
    } catch (error) {
        console.error('Error:', error.message);
        return 'Error: Mes inválido, por favor ingresa un valor entre 1 y 12.';
    }

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

    /**
     * Pavesic es el costo-margen analysis
     * Al 30 septiembre 2024 faltan los siguientes porque tengo que agregar el dato de Tiempo de Preparacion al plato registrado

    1. APC:
        - Costo Variable Unitario: si el costo unitario es mayor al promedio de costos unitarios, es Alto, sino es Bajo
        - Margen de contribucion Unitario: si el margen unitario es mayor al promedio de margenes unitarios, es Alto, sino es Bajo
        - Tiempo de Preparacion: Si el tiempo de preparacion es mayor al promedio, es Alto, sino es bajo

        Clasificacion: 
            - Costo Variable, Margen, Tiempo pre, Clasificacion, Clasificacion global
            - Bajo, Alto, Bajo, Super Estrella, Producto Bueno
            - Bajo, Alto, Alto, Estrella, Producto Bueno
            - Bajo, Bajo, Bajo, Economico, Producto Bueno
            - Alto, Alto, Bajo, Aceptable, Producto medio
            - Bajo, Bajo, Alto, Laborioso, Producto medio
            - Alto, Alto, Alto, Costoso, Producto Malo
            - Alto, Bajo, Bajo, Perdedor, Producto Malo
            - Alto, Bajo, Alto, Fatal, Producto Malo

    
    4. LeBruto-Ashley&Quain:
        - Popularidad: el % de ventas sobre el total es mayor al promedio es Alto, sino es Bajo
        - Margen de contribucion: el Margen Unitario es mayor al promedio es Alto, sino es Bajo
        - Mano de Obra: el tiempo de preparacion es mayor al promedio es Alto, sino es Bajo

        Clasificacion:
            - Popularidad, Margen de Contribucion, Mano de Obra, Clasificacion
            - Alta, Alto, Bajo, Super Estrella
            - Alta, Alto, Alto, Estrella
            - Baja, Alto, Bajo, Economico
            - Baja, Alto, Alto, Impopular
            - Alta, Bajo, Bajo, Popular
            - Alta, Bajo, Alto, Costoso
            - Baja, Bajo, Bajo, Perdedor
            - Baja, Bajo, Alto, Fatal
    
    */

    // const EQResult = await PuntoEquilibrio(mesFormat, Informes_Categoria, 25000) //Este aun no esta pulido, falta trabajar y consultar con Rodrigo, faltan los costos fijos de la otra tabla

    
    const resultadosFinales = await executeInform(mesFormat, Informes_Categoria)

    try {
        console.log(JSON.stringify(resultadosFinales.ADLResults, null, 2));
        res.status(200).json(resultadosFinales);
    } catch (error) {
        res.status(500).json({ error: 'Error creating inform.' });
    }
}