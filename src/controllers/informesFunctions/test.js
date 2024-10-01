export const omnesFunction = async (mesFormat, Informes_Categoria) => {     
    //Mover todo la comprension para las formulas en la documentacion/readme
    
    //de repente puedo mejorar haciendo query a menos datos y calculando todo en js.
    //Por ejemplo, todas las funciones de sequelize las puedo reemplazar por funciones JS. Solo recibir los datos en objetos y arrays y hacer los calculos con JS. 
    console.log('OmnesFunction execute\n')
    //1er principio    
    const resultadoNuevo = await Plato.findOne({
        attributes: [
            [Sequelize.fn('MAX', Sequelize.col('Valor_Venta')), 'maxValorVenta'],  // Máximo valor de venta
            [Sequelize.fn('MIN', Sequelize.col('Valor_Venta')), 'minValorVenta'],  // Mínimo valor de venta
            [Sequelize.literal('COUNT(*)'), 'cantidadPlatos'],  // Contar la cantidad de platos
            [Sequelize.fn('SUM', Sequelize.literal('Cantidad_vendida * Valor_Venta')), 'totalVentas'],  // Suma de ventas totales
            [Sequelize.fn('SUM', Sequelize.col('Cantidad_vendida')), 'cantidadVendida'],  // Suma de cantidad vendida
            [Sequelize.fn('SUM', Sequelize.col('Valor_Venta')), 'valorVenta']  // Suma de valor de venta
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        },
        raw: true  
    });

    const columnas = await Plato.findOne({
        attributes: [
            'Valor_Venta',  
            'Cantidad_vendida'  
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        },
        raw: true  
    })


    //Para 1er principio
    const VA = Number(resultadoNuevo.maxValorVenta);
    const VB = Number(resultadoNuevo.minValorVenta);
    const cantidadPlatos = Number(resultadoNuevo.cantidadPlatos);

    //Para 2do principio
    const sumaTotalVentas = Number(resultadoNuevo.totalVentas);
    const sumaCantidadVendida = Number(resultadoNuevo.cantidadVendida);
    const sumaValorVenta = Number(resultadoNuevo.valorVenta);



    //1er principio
    const AmplitudGama = Number(((VA - VB) / 3).toFixed(2));
    const Z1 = [VB, VB + AmplitudGama]
    const Z2 = [VB + AmplitudGama, VB + (2* AmplitudGama)]
    const Z3 = [VB + (2* AmplitudGama), VB + (3 * AmplitudGama)]

    const definePlatosZones = async (zone) => { 
        await Plato.count({
            where : {
                Mes_plato: mesFormat,
                Categoria: Informes_Categoria,
                Valor_Venta: {
                    [Sequelize.Op.between]: zone
            
                }
            }
        })
    }

    const platosZ1 = await definePlatosZones(Z1)
    const platosZ2 = await definePlatosZones(Z2)
    const platosZ3 = await definePlatosZones(Z3)

    const cumpleOmnes1 = platosZ1 + platosZ3 === platosZ2 ? true : false

//  2do principio

    const apertura2 = VA / VB
    const cumpleOmnes2 = cantidadPlatos <= 9 ? (apertura2 <= 2.5 ? true : false) : (apertura2 <= 3 ? true : false)

// 3er principio: -1 significa menor a 0.85, 0 significa entre 0.85 y 1.05, 1 significa mas de 1.05
    const PMP = sumaTotalVentas / sumaCantidadVendida
    const PMO = sumaValorVenta / cantidadPlatos

    const cumpleOmnes3 = PMP / PMO < 0.85 ? -1 : ((PMP / PMO >= 0.85 && PMP / PMO <= 1.05) ? 0 : 1)

//4to principio

    const cumpleOmnes4 = `Promocion debe ser menor a ${Number(PMP.toFixed(2))}`

    const omnesResult = {
        1: cumpleOmnes1,
        2: cumpleOmnes2,
        3: cumpleOmnes3,
        4: cumpleOmnes4
    }

    console.log('\nOmnesFunction finish')
    return omnesResult
}






//antigua funcion

// export const omnesFunction = async (mesFormat, Informes_Categoria) => {     
//     //Mover todo la comprension para las formulas en la documentacion/readme
    
//     //de repente puedo mejorar haciendo query a menos datos y calculando todo en js.
//     //Por ejemplo, todas las funciones de sequelize las puedo reemplazar por funciones JS. Solo recibir los datos en objetos y arrays y hacer los calculos con JS. 
//     console.log('OmnesFunction execute\n')
//     //1er principio    
//     const resultadoNuevo = await Plato.findOne({
//         attributes: [
//             [Sequelize.fn('MAX', Sequelize.col('Valor_Venta')), 'maxValorVenta'],  // Máximo valor de venta
//             [Sequelize.fn('MIN', Sequelize.col('Valor_Venta')), 'minValorVenta'],  // Mínimo valor de venta
//             [Sequelize.literal('COUNT(*)'), 'cantidadPlatos'],  // Contar la cantidad de platos
//             [Sequelize.fn('SUM', Sequelize.literal('Cantidad_vendida * Valor_Venta')), 'totalVentas'],  // Suma de ventas totales
//             [Sequelize.fn('SUM', Sequelize.col('Cantidad_vendida')), 'cantidadVendida'],  // Suma de cantidad vendida
//             [Sequelize.fn('SUM', Sequelize.col('Valor_Venta')), 'valorVenta']  // Suma de valor de venta
//         ],
//         where: {
//             Mes_plato: mesFormat,
//             Categoria: Informes_Categoria
//         },
//         raw: true  
//     });

//     //Para 1er principio
//     const VA = Number(resultadoNuevo.maxValorVenta);
//     const VB = Number(resultadoNuevo.minValorVenta);
//     const cantidadPlatos = Number(resultadoNuevo.cantidadPlatos);

//     //Para 2do principio
//     const sumaTotalVentas = Number(resultadoNuevo.totalVentas);
//     const sumaCantidadVendida = Number(resultadoNuevo.cantidadVendida);
//     const sumaValorVenta = Number(resultadoNuevo.valorVenta);



//     //1er principio
//     const AmplitudGama = Number(((VA - VB) / 3).toFixed(2));
//     const Z1 = [VB, VB + AmplitudGama]
//     const Z2 = [VB + AmplitudGama, VB + (2* AmplitudGama)]
//     const Z3 = [VB + (2* AmplitudGama), VB + (3 * AmplitudGama)]

//     const definePlatosZones = async (zone) => { 
//         await Plato.count({
//             where : {
//                 Mes_plato: mesFormat,
//                 Categoria: Informes_Categoria,
//                 Valor_Venta: {
//                     [Sequelize.Op.between]: zone
            
//                 }
//             }
//         })
//     }

//     const platosZ1 = await definePlatosZones(Z1)
//     const platosZ2 = await definePlatosZones(Z2)
//     const platosZ3 = await definePlatosZones(Z3)

//     const cumpleOmnes1 = platosZ1 + platosZ3 === platosZ2 ? true : false

// //  2do principio

//     const apertura2 = VA / VB
//     const cumpleOmnes2 = cantidadPlatos <= 9 ? (apertura2 <= 2.5 ? true : false) : (apertura2 <= 3 ? true : false)

// // 3er principio: -1 significa menor a 0.85, 0 significa entre 0.85 y 1.05, 1 significa mas de 1.05
//     const PMP = sumaTotalVentas / sumaCantidadVendida
//     const PMO = sumaValorVenta / cantidadPlatos

//     const cumpleOmnes3 = PMP / PMO < 0.85 ? -1 : ((PMP / PMO >= 0.85 && PMP / PMO <= 1.05) ? 0 : 1)

// //4to principio

//     const cumpleOmnes4 = `Promocion debe ser menor a ${Number(PMP.toFixed(2))}`

//     const omnesResult = {
//         1: cumpleOmnes1,
//         2: cumpleOmnes2,
//         3: cumpleOmnes3,
//         4: cumpleOmnes4
//     }

//     console.log('\nOmnesFunction finish')
//     return omnesResult
// }