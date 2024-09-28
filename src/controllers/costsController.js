import Costos from "../dao/models/Costs.js"
import convertToMonthYear from "../utils/convertToMonthYear.js";

export const getCosts = async (req, res) => { 
    try {
        const costs = await Costos.findAll();
        res.status(200).json(costs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching costs.' });
    }
}
 
export const createCosts = async (req, res) => { 
    const { Sueldo_Cocina, Sueldo_Servicio, Sueldo_Administrativos, Alquiler, Depreciacion, Servicios_basicos, Publicidad, Internet, Otros, Mes } = req.body;
    
    const mesFormat = convertToMonthYear(Mes)

    try {
        // Crea un nuevo registro en la tabla Platos
        const newCosts = await Costos.create({
            Sueldo_Cocina: Sueldo_Cocina,
            Sueldo_Servicio: Sueldo_Servicio,
            Sueldo_Administrativos: Sueldo_Administrativos,
            Alquiler: Alquiler,
            Depreciacion: Depreciacion,
            Servicios_basicos: Servicios_basicos,
            Publicidad: Publicidad,
            Internet: Internet,
            Otros: Otros,
            Mes: mesFormat
        });

        // Envía una respuesta exitosa con el nuevo registro
        res.status(201).json(newCosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating plate.' });
    }
}

export const updateCosts = async (req, res) => { 
try {
    
} catch (error) {
    
}

}

export const deleteCosts = async (req, res) => { 
try {
    
} catch (error) {
    
}

}
