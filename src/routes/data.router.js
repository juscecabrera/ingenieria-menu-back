import { Router } from "express";
import config from "../config.js";
import { getPlates, getPlatesById, createPlates, updatePlate, deletePlate } from "../controllers/dataController.js";

const router = Router()

//Platos
router.post('/plates', createPlates);
router.get('/plates', getPlates);
router.get('/plates/:id', getPlatesById);
router.put('/plates/:id', updatePlate);
router.delete('/plates/:id', deletePlate);
//agregar un router que haga todos los calculos necesarios

export default router