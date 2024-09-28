import Plato from "../../dao/models/Plate.js";
import { Sequelize, Op } from "sequelize";

export const omnesFunction = async (mesFormat, Informes_Categoria) => { 
/*
    1. Fetchear en la tabla Costos todas la fila menos id y mes SEGUN EL MES. 
    2. Fetcher en la tabla Platos todas las FILAS menos ID SEGUN Mes_plato y Categoria

    1. Omnes:
    1er principio:

    1. Calcular Valor de Venta mas ALTO o VA = SELECT Max(Valor_venta) FROM Platos WHERE Mes_Plato = mesFormat AND Categoria = Informes_Categoria

    2. Calcular Valor de Venta mas BAJO o VB = SELECT Min(Valor_venta) FROM Platos WHERE Mes_Plato = mesFormat AND Categoria = Informes_Categoria

    3. Calcular Amplitud de Gama = (VA - VB) / 3
    */

    const ValorVentaAlto = await Plato.findOne({
        attributes: [[Sequelize.fn('MAX', Sequelize.col('Valor_Venta')), 'maxValorVenta']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    })

    const ValorVentaBajo = await Plato.findOne({
        attributes: [[Sequelize.fn('MIN', Sequelize.col('Valor_Venta')), 'minValorVenta']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    })

    

    
    const VA = Number(ValorVentaAlto.get('maxValorVenta'))
    const VB = Number(ValorVentaBajo.get('minValorVenta'))

    const AmplitudGama = Number(((VA - VB) / 3).toFixed(2));

    const Z1 = [VB, VB + AmplitudGama]

    const Z2 = [VB + AmplitudGama, VB + (2* AmplitudGama)]

    const Z3 = [VB + (2* AmplitudGama), VB + (3 * AmplitudGama)]


    const platosZ1 = await Plato.count({
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
            Valor_Venta: {
                [Sequelize.Op.between]: Z1
        
            }
        }
    })

    const platosZ2 = await Plato.count({
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
            Valor_Venta: {
                [Sequelize.Op.between]: Z2
        
            }
        }
    })

    const platosZ3 = await Plato.count({
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
            Valor_Venta: {
                [Sequelize.Op.between]: Z3
        
            }
        }
    })

    const cumpleOmnes1 = platosZ1 + platosZ3 === platosZ2 ? true : false

    /*
    2do principio:
        1. VA / VB = Apertura
        2. Cuantos platos hay en ese mes en esa categoria
        3. Hasta 9 platos: si Apertura es menor a 2.5, cumple
            10 platos o mas: si Apertura es menor a 3, cumple
    
    */ 

    const apertura2 = VA / VB

    const cantidadPlatos = await Plato.count({
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    })


    const cumpleOmnes2 = cantidadPlatos <= 9 ? (apertura2 <= 2.5 ? true : false) : (apertura2 <= 3 ? true : false)


    /*
    3er principio:

    1. LISTO Calcular PMP: Suma de Ventas Totales / Suma de Cantidad Vendida
    2. Calcular PMO: Suma de Valor Venta / Cantidad de platos ofertados
    3. Calcular PMP / PMO 
    4. Si resultado menor a 0.85: disminuir los precios y calcular un nuevo precio. 
        Si el resultado entre 0.85 y 1.05: mantener los precios
        Si el resultado mayor a 1.05: aumentar los precios y calcular un nuevo precio
    */


    //Falto en la tabla MySQL tener las Ventas Totales = Cantidad Vendida * Valor de venta

    const ventasTotales = await Plato.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.literal('Cantidad_vendida * Valor_Venta')), 'totalVentas']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    })

    const cantidadVendida = await Plato.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('Cantidad_vendida')), 'cantidadVendida']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    })

    const sumaTotalVentas = ventasTotales.get('totalVentas')
    const sumaCantidadVendida = cantidadVendida.get('cantidadVendida')

    const PMP = sumaTotalVentas / sumaCantidadVendida




    const valorVenta = await Plato.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('Valor_Venta')), 'valorVenta']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    })

    const sumaValorVenta = valorVenta.get('valorVenta')

    const PMO = sumaValorVenta / cantidadPlatos

    const cumpleOmnes3 = PMP / PMO < 0.85 ? -1 : ((PMP / PMO >= 0.85 && PMP / PMO <= 1.05) ? 0 : 1)
    //-1 significa menor a 0.85, 0 significa entre 0.85 y 1.05, 1 significa mas de 1.05

    /*
    4to principio:

    1. La promocion debe ser menor a PMP.
    */ 

    const cumpleOmnes4 = `Promocion debe ser menor a ${PMP}`

    const omnesResult = {
        1: cumpleOmnes1,
        2: cumpleOmnes2,
        3: cumpleOmnes3,
        4: cumpleOmnes4
    }

    return omnesResult
}