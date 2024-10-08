import { Router } from "express";
import { getPlates, getPlatesById, createPlates, updatePlate, deletePlate, createInforms } from "../controllers/dataController.js";

const router = Router()

//Platos
router.get('/plates', getPlates);
router.get('/plates/:id', getPlatesById);
router.post('/plates', createPlates);
router.put('/plates/:id', updatePlate);
router.delete('/plates/:id', deletePlate);
//agregar un router que haga todos los calculos necesarios

//Informs
router.post('/informs', createInforms)

export default router