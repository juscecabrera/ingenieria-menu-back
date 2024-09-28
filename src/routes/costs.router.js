import { Router } from "express";
import { getCosts, createCosts, updateCosts, deleteCosts } from "../controllers/costsController.js";

const router = Router()

//Costos
router.get('/costs', getCosts);
router.post('/costs', createCosts);
router.put('/costs/:id', updateCosts);
router.delete('/costs/:id', deleteCosts);
// router.get('/plates/:id', getPlatesById);
//agregar un router que haga todos los calculos necesarios

export default router