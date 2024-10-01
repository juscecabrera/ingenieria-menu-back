import Plato from "../../dao/models/Plate.js";
import { Sequelize, Op } from "sequelize";

export const omnesFunction = async (mesFormat, Informes_Categoria) => {     
    console.log('OmnesFunction execute\n')
    console.time('start')
    //Mover todo la comprension para las formulas en la documentacion/readme
    //de repente puedo mejorar haciendo query a menos datos y calculando todo en js.
    //Por ejemplo, todas las funciones de sequelize las puedo reemplazar por funciones JS. Solo recibir los datos en objetos y arrays y hacer los calculos con JS. 
    
    //1er principio    
    const columnas = await Plato.findAll({
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

    const Valor_Venta = columnas.map(item => Number(item.Valor_Venta));
    const Cantidad_vendida = columnas.map(item => Number(item.Cantidad_vendida));

    const VA = Math.max(...Valor_Venta) //Maximo valor de venta
    const VB = Math.min(...Valor_Venta) //Minimo valor de venta
    const cantidadPlatos = Valor_Venta.length // Cantidad de platos
    const sumaTotalVentas = Valor_Venta.reduce((total, valor, index) => {
        return total + valor * Cantidad_vendida[index];
    }, 0);
    const sumaCantidadVendida = Cantidad_vendida.reduce((total, valor) => {
        return total + valor;
    }, 0); 
    const sumaValorVenta = Valor_Venta.reduce((total, valor) => {
        return total + valor;
    }, 0); 



    //1er principio
    //Usar la misma logica de Js para tener una sola consulta
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

    console.timeEnd('start')
    console.log('\nOmnesFunction finish')
    return omnesResult
}


//Corregir BCG, es por la cantidad promedio, no por 10%
//Creo que el alg esta bien porque solo hace una consulta
export async function BCGPop(mesFormat, Informes_Categoria) {

    /*
    2do informe: BCG

    Mide dos variables POR PLATO: 
        1. Popularidad: % de platos vendidos que el plato representa sobre el total. 
            -  Alta: popularidad >= 10 %
            -   Baja: popularidad < 10 %
            Calculo: (Cantidad_vendida / SUM(Cantidad_vendida)) * 100%
        2. Rentabilidad: Valor de venta - Costo unitario
            - Alta: mayor a 15 soles (consultar con Rodrigo)
            - Baja: menor a 15 soles 
            Posiblemente es un % del valor de venta, revisar despues
            Calculo: (Valor_Venta - Costo)
    */

    // Obtener los platos y sus cantidades vendidas
    const platos = await Plato.findAll({
        attributes: ['Nombre', 'Cantidad_vendida', 'Valor_Venta', 'Costo'],  // Añadir Valor_Venta y Costo
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });
    
    // Calcular la cantidad total vendida y crear un objeto de cantidades por plato
    const rentabilidadPorPlato = {};
    let sumaCantidadVendida = 0;
    
    platos.forEach(plato => {
        const cantidadVendida = plato.get('Cantidad_vendida');
        const nombrePlato = plato.get('Nombre');
        const valorVenta = plato.get('Valor_Venta');
        const costoUnitario = plato.get('Costo');
    
        // Calcular la rentabilidad
        const rentabilidad = valorVenta - costoUnitario;
    
        // Clasificar como Alta o Baja
        const rentabilidadFinal = rentabilidad > 15 ? "Alta" : "Baja";
    
        // Almacenar en el objeto
        rentabilidadPorPlato[nombrePlato] = {
        cantidadVendida: cantidadVendida,
        rentabilidad: rentabilidadFinal,
        };
    
        sumaCantidadVendida += cantidadVendida; // Sumar cantidad vendida total
    });
    
    // Calcular el porcentaje y determinar la popularidad
    const resultadosFinales = {};
    for (const [nombrePlato, { cantidadVendida }] of Object.entries(rentabilidadPorPlato)) {
        const porcentaje = (cantidadVendida / sumaCantidadVendida) * 100;
        const popularidadPorcentual = porcentaje.toFixed(2); 

        //Aqui agregar la logica para que sea menor o mayor al promedio de popularidad, no al 10%
        const popularidadFinal = popularidadPorcentual <= 10 ? "Baja" : "Alta";

        // Determinar la categoría BCG
        const rentabilidadFinal = rentabilidadPorPlato[nombrePlato].rentabilidad;
        let BCGCategory;

        if (popularidadFinal === "Alta" && rentabilidadFinal === "Alta") {
            BCGCategory = "Estrella";
        } else if (popularidadFinal === "Alta" && rentabilidadFinal === "Baja") {
            BCGCategory = "Popular";
        } else if (popularidadFinal === "Baja" && rentabilidadFinal === "Alta") {
            BCGCategory = "Impopular";
        } else {
            BCGCategory = "Perdedor";
        }


        resultadosFinales[nombrePlato] = {
            rentabilidad: rentabilidadFinal,
            popularidad: popularidadFinal,
            BCGCategory: BCGCategory,
        };
    }
    
    return resultadosFinales;
}

export async function ADL(mesFormat, Informes_Categoria) {
    /*
    3er informe: ADL
    
    2 variables:
    
    1. Margen de Contribucion: level size = (mayor margen - menor margen) / 4
        Crecimiento: [..., mayor margen]
        Introduccion: [...]
        Madurez: [...]
        Declinacion: [menor margen, menor margen + level size]

    2. Cantidad vendida: level size = (mayor cantidad de ventas - menor cantidad de ventas) / 5
        Dominante: [..., mayor cantidad de ventas]
        Fuerte: [...]
        Favorable: [...]
        Debil: [...]
        Marginal: [menor cantidad de ventas, menor cantidad de ventas + level size]

    Cada plato tiene dos atributos: margen de contribucion y cantidad vendida



    */
    const maxRentabilidad = await Plato.findOne({
        attributes: [
            [Sequelize.fn('MAX', Sequelize.literal('Valor_Venta - Costo')), 'MaxRentabilidad'] 
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    const minRentabilidad = await Plato.findOne({
        attributes: [
            [Sequelize.fn('MIN', Sequelize.literal('Valor_Venta - Costo')), 'MinRentabilidad'] 
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    const CantidadVentasAlto = await Plato.findOne({
        attributes: [[Sequelize.fn('MAX', Sequelize.col('Cantidad_vendida')), 'maxCantidadVendida']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    })

    const CantidadVentasBajo = await Plato.findOne({
        attributes: [[Sequelize.fn('MIN', Sequelize.col('Cantidad_vendida')), 'minCantidadVendida']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    })


    const CVA = Number(CantidadVentasAlto.get('maxCantidadVendida'))
    const CVB = Number(CantidadVentasBajo.get('minCantidadVendida'))
    const maxRent = maxRentabilidad ? Number(maxRentabilidad.get('MaxRentabilidad')) : null;
    const minRent = minRentabilidad ? Number(minRentabilidad.get('MinRentabilidad')) : null;

    const CantidadVentasSize = (CVA - CVB) / 5

    const RentabilidadSize = (maxRent - minRent) / 4

    //Rentabilidad
    const Crecimiento =  [CVB + (3 * CantidadVentasSize), CVA]
    const Introduccion = [CVB + (2 * CantidadVentasSize), CVB + (3 * CantidadVentasSize)]
    const Madurez = [CVB + CantidadVentasSize, CVB + (2 *CantidadVentasSize)]
    const Declinacion = [CVB, CVB + CantidadVentasSize]


    //Cantidad Vendida
    const Dominante = [minRent +  (4 * RentabilidadSize),  maxRent]
    const Fuerte = [minRent +  (3 * RentabilidadSize),  minRent +  (4 * RentabilidadSize)]
    const Favorable = [minRent +  (2 * RentabilidadSize),  minRent +  (3 * RentabilidadSize)]
    const Debil = [minRent + RentabilidadSize,  minRent +  (2 * RentabilidadSize)]
    const Marginal = [minRent, minRent + RentabilidadSize]

    
    const platos = await Plato.findAll({
        attributes: ['Nombre', 'Cantidad_vendida', [Sequelize.literal('Valor_Venta - Costo'), 'Rentabilidad']],
        where : {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    })

    const resultado = {};
    platos.forEach(plato => {
        const nombre = plato.get('Nombre');
        const rentabilidad = plato.get('Rentabilidad');
        const cantidadVendida = plato.get('Cantidad_vendida');

        // Determinar la categoría de Rentabilidad
        let rentabilidadCategoria;
        if (rentabilidad < Crecimiento[1]) {
            rentabilidadCategoria = 'Declinacion';
        } else if (rentabilidad < Introduccion[1]) {
            rentabilidadCategoria = 'Introduccion';
        } else if (rentabilidad < Madurez[1]) {
            rentabilidadCategoria = 'Crecimiento';
        } else {
            rentabilidadCategoria = 'Madurez';
        }

        // Determinar la categoría de Cantidad Vendida
        let cantidadVendidaCategoria;
        if (cantidadVendida >= Dominante[0] && cantidadVendida <= Dominante[1]) {
            cantidadVendidaCategoria = 'Dominante';
        } else if (cantidadVendida >= Fuerte[0] && cantidadVendida <= Fuerte[1]) {
            cantidadVendidaCategoria = 'Fuerte';
        } else if (cantidadVendida >= Favorable[0] && cantidadVendida <= Favorable[1]) {
            cantidadVendidaCategoria = 'Favorable';
        } else if (cantidadVendida >= Debil[0] && cantidadVendida <= Debil[1]) {
            cantidadVendidaCategoria = 'Debil';
        } else {
            cantidadVendidaCategoria = 'Marginal';
        }

        resultado[nombre] = {
            rentabilidadCategoria,
            cantidadVendidaCategoria,
        };
    }); 

    return resultado

}

export const IRP = async (mesFormat, Informes_Categoria) => {
    /*
    4to informe: IRP

    % de margen del plato sobre el total 
    % de venta del plato sobre el total
    
    IRP = % de margen / % de venta

    Mayor a 1 o menor a 1.

    1. % de margen = (Cantidad_vendida * Margen) / suma de margenes totales
    2. % de venta = (Cantidad vendida * Valor_Venta) / suma de ventas totales

    
    */ 

    const platos = await Plato.findAll({
        attributes: [
            'Nombre',
            [Sequelize.literal('(Cantidad_vendida * (Valor_Venta - Costo))'), 'margenTotal'],
            [Sequelize.literal('(Cantidad_vendida * Valor_Venta)'), 'ventasTotales']
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    // Variables para las sumas totales
    let sumaMargenTotal = 0;
    let sumaVentasTotales = 0;

    // Calcular las sumas totales
    platos.forEach(plato => {
        sumaMargenTotal += parseFloat(plato.get('margenTotal'));   // Suma del margen total
        sumaVentasTotales += parseFloat(plato.get('ventasTotales')); // Suma de ventas totales
    });

    // Crear un objeto con el nombre del plato como clave y un array con los porcentajes como valor
    const resultado = {};
    platos.forEach(plato => {
        const nombre = plato.get('Nombre');
        const margenTotal = plato.get('margenTotal');
        const ventasTotales = plato.get('ventasTotales');

        // Calcular el porcentaje de margen y ventas totales
        const porcentajeMargen = Number(((margenTotal / sumaMargenTotal) * 100).toFixed(2));
        const porcentajeVentas = Number(((ventasTotales / sumaVentasTotales) * 100).toFixed(2));

        // Guardar ambos valores en un array
        const IRPFinal = Number((porcentajeMargen / porcentajeVentas).toFixed(2))
        resultado[nombre] = IRPFinal;
    });

    return resultado;
}

export const IndexPopularidad = async (mesFormat, Informes_Categoria) => {
    const platos = await Plato.findAll({
        attributes: [
            'Nombre',
            'Cantidad_vendida',
            'Dias_en_carta'
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    // Calcular la suma total de cantidades vendidas y días en carta
    let sumaCantidadVendidaTotal = 0;
    let sumaDiasEnCartaTotal = 0;
    
    platos.forEach(plato => {
        sumaCantidadVendidaTotal += parseFloat(plato.get('Cantidad_vendida')); // Sumar cantidades vendidas
        sumaDiasEnCartaTotal += parseFloat(plato.get('Dias_en_carta')); // Sumar días en carta
    });

    // Crear un objeto con el nombre del plato como clave y un array con ambos porcentajes como valor
    const resultado = {};
    platos.forEach(plato => {
        const nombre = plato.get('Nombre');
        const cantidadVendida = parseFloat(plato.get('Cantidad_vendida'));
        const diasEnCarta = parseFloat(plato.get('Dias_en_carta'));

        // Calcular los porcentajes
        const porcentajeCantidadVendida = Number(((cantidadVendida / sumaCantidadVendidaTotal) * 100).toFixed(2));
        const porcentajeDiasEnCarta = Number(((diasEnCarta / sumaDiasEnCartaTotal) * 100).toFixed(2));

        // Guardar ambos porcentajes en el objeto resultado
        const IPFinal = Number((porcentajeCantidadVendida / porcentajeDiasEnCarta).toFixed(2))
        resultado[nombre] = IPFinal;
    });

    return resultado;
}

export const CostoMargenAnalysis = async (mesFormat, Informes_Categoria) => {
    // Obtener los platos y calcular los costos y márgenes
    const platos = await Plato.findAll({
        attributes: [
            'Nombre',
            [Sequelize.literal('Costo'), 'costo'],
            [Sequelize.literal('(Cantidad_vendida * (Valor_Venta - Costo))'), 'margenTotal']
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        }
    });

    // Calcular el costo promedio y el margen promedio
    let sumaCostos = 0;
    let sumaMargenes = 0;

    platos.forEach(plato => {
        sumaCostos += parseFloat(plato.get('costo'));
        sumaMargenes += parseFloat(plato.get('margenTotal'));
    });

    const cantidadPlatos = platos.length;
    const costoPromedio = sumaCostos / cantidadPlatos;
    const margenPromedio = sumaMargenes / cantidadPlatos;

    // Crear un objeto con el nombre del plato como clave y los atributos como valor
    const resultado = {};
    platos.forEach(plato => {
        const nombre = plato.get('Nombre');
        const costo = parseFloat(plato.get('costo'));
        const margen = parseFloat(plato.get('margenTotal'));

        // Asignar Costo Ponderado
        const costoPonderado = costo < costoPromedio ? 'Bajo' : 'Alto';

        // Asignar MCP
        const mcp = margen < margenPromedio ? 'Bajo' : 'Alto';

        // Asignar CMA
        let cma;
        if (costoPonderado === 'Bajo' && mcp === 'Alto') {
            cma = 'Selecto';
        } else if (costoPonderado === 'Alto' && mcp === 'Alto') {
            cma = 'Estandar';
        } else if (costoPonderado === 'Bajo' && mcp === 'Bajo') {
            cma = 'Durmiente';
        } else {
            cma = 'Problema';
        }

        // Guardar los atributos en el objeto resultado
        resultado[nombre] = [costoPonderado, mcp, cma];
    });

    return resultado;
};

export const Miller = async (mesFormat, Informes_Categoria) => {
    // Obtener todos los platos y sus atributos necesarios
    const platos = await Plato.findAll({
        attributes: ['Nombre', 'Costo', 'Cantidad_vendida'],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    // Inicializar variables para calcular promedios
    let sumaCostos = 0;
    let sumaCantidadVendida = 0;
    const cantidadPlatos = platos.length;

    // Sumar todos los costos y cantidades vendidas
    platos.forEach(plato => {
        sumaCostos += parseFloat(plato.get('Costo'));
        sumaCantidadVendida += parseFloat(plato.get('Cantidad_vendida'));
    });

    // Calcular promedios
    const costoPromedio = sumaCostos / cantidadPlatos;
    const cantidadVendidaPromedio = sumaCantidadVendida / cantidadPlatos;

    // Crear un objeto para almacenar los resultados
    const resultado = {};

    // Evaluar cada plato y asignar atributos
    platos.forEach(plato => {
        const nombre = plato.get('Nombre');
        const costo = parseFloat(plato.get('Costo'));
        const cantidadVendida = parseFloat(plato.get('Cantidad_vendida'));

        // Determinar atributos basados en promedios
        const costoAlimentos = costo < costoPromedio ? "Bajo" : "Alto";
        const cantidadVendidaAtributo = cantidadVendida < cantidadVendidaPromedio ? "Bajo" : "Alto";

        // Determinar el atributo MM
        let mm;
        if (costoAlimentos === "Bajo" && cantidadVendidaAtributo === "Alto") {
            mm = "Ganador";
        } else if (costoAlimentos === "Alto" && cantidadVendidaAtributo === "Alto") {
            mm = "Marginal Alto";
        } else if (costoAlimentos === "Bajo" && cantidadVendidaAtributo === "Bajo") {
            mm = "Marginal Bajo";
        } else {
            mm = "Perdedor";
        }

        // Almacenar resultados en el objeto
        resultado[nombre] = [costoAlimentos, cantidadVendidaAtributo, mm];
    });

    return resultado;
};

export const multiCriterioFunction = (multiCriterio) => {
    const resultadosArray = [];

    const nombresPlatos = Object.keys(multiCriterio.BCGResults);
    
    nombresPlatos.forEach(nombrePlato => {
        const bcgCategory = multiCriterio.BCGResults[nombrePlato].BCGCategory;
        const costoMargen = multiCriterio.CostoMargenAnalysisResults[nombrePlato][2]; // CMA
        const miller = multiCriterio.MillerResults[nombrePlato][2]; // MM
        const irp = multiCriterio.IRPResults[nombrePlato];
        const indexPopularidad = multiCriterio.IndexPopularidadResults[nombrePlato];

        const puntajeBCG = (bcgCategory === 'Estrella') ? 4 : (bcgCategory === 'Impopular') ? 3 : (bcgCategory === 'Popular') ? 2 : 1;
        const puntajeCostoMargen = (costoMargen === 'Selecto') ? 4 : (costoMargen === 'Estandar') ? 3 : (costoMargen === 'Durmiente') ? 2 : 1;
        const puntajeMiller = (miller === 'Ganador') ? 4 : (miller === 'Marginal Alto') ? 3 : (miller === 'Marginal Bajo') ? 2 : 1;
        const puntajeIRP = (irp > 1) ? 4 : 1;
        const puntajeIndexPopularidad = (indexPopularidad > 1) ? 4 : 1;

        const totalPuntaje = puntajeBCG + puntajeCostoMargen + puntajeMiller + puntajeIRP + puntajeIndexPopularidad;

        const resultado = {
            nombre: nombrePlato,
            resultados: [
                { BCGCategory: [bcgCategory, puntajeBCG] },
                { costoMargen: [costoMargen, puntajeCostoMargen] },
                { miller: [miller, puntajeMiller] },
                { IRP: [irp, puntajeIRP] },
                { IndexPopularidad: [indexPopularidad, puntajeIndexPopularidad] }
            ],
            Puntaje_Multicriterio: totalPuntaje
        };

        resultadosArray.push(resultado);
    });

    return resultadosArray;
};

export const multiCriterioResultsOnly = (resultados) => {
    const puntajesObjeto = {};

    resultados.forEach(resultado => {
        const nombre = resultado.nombre;
        const puntaje = resultado.Puntaje_Multicriterio;

        puntajesObjeto[nombre] = puntaje;
    });

    return puntajesObjeto;
};

export const PuntoEquilibrio = async (mesFormat, Informes_Categoria, costosFijos) => {
    // Consulta para obtener los platos
    const platos = await Plato.findAll({
        attributes: [
            'Nombre',
            [Sequelize.literal('Valor_Venta'), 'Valor_Venta'], // Obtener el valor de venta
            [Sequelize.literal('Costo'), 'Costo'], // Obtener el costo
            [Sequelize.literal('(Cantidad_vendida * (Valor_Venta - Costo))'), 'margenTotal'], // Margen total
            [Sequelize.literal('(Cantidad_vendida * Valor_Venta)'), 'ventasTotales'] // Ventas totales
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria,
        }
    });

    // Procesar el resultado para obtener el objeto necesario
    const platosArray = platos.map(plato => {
        return {
            Nombre: plato.get('Nombre'),
            Valor_Venta: parseFloat(plato.get('Valor_Venta')),
            Costo: parseFloat(plato.get('Costo')),
            margenTotal: parseFloat(plato.get('margenTotal')),
            ventasTotales: parseFloat(plato.get('ventasTotales'))
        };
    });

    // Calcular el margen promedio
    let sumaMargenes = 0;
    let totalPlatos = platosArray.length;

    platosArray.forEach(plato => {
        const margen = plato.Valor_Venta - plato.Costo; // Margen por plato
        sumaMargenes += margen;
    });

    const margenPromedio = sumaMargenes / totalPlatos;

    // Calcular cuántos platos vender en total
    const totalPlatosAVender = Math.ceil(costosFijos / margenPromedio);

    // Inicializar el objeto de resultados
    const ventasPorPlato = {};

    // Calcular cuántos de cada plato se deben vender
    let totalCostos = 0;
    let totalVentas = 0;

    platosArray.forEach(plato => {
        const nombre = plato.Nombre;
        const valorVenta = plato.Valor_Venta;
        const costo = plato.Costo;

        // Calcular cuántos de este plato vender
        const cantidadPorPlato = Math.ceil((totalPlatosAVender / totalPlatos)); // Distribuir ventas por plato

        // Guardar resultados
        ventasPorPlato[nombre] = {
            cantidad: cantidadPorPlato,
            totalVentas: cantidadPorPlato * valorVenta,
            totalCostos: cantidadPorPlato * costo,
        };

        // Sumar ventas totales y costos totales
        totalVentas += ventasPorPlato[nombre].totalVentas;
        totalCostos += ventasPorPlato[nombre].totalCostos;
    });

    // Ajustar los resultados para que la diferencia cumpla la condición
    const diferencia = totalVentas - totalCostos;

    if (diferencia !== costosFijos) {
        const ajuste = (costosFijos - diferencia) / totalPlatos; // Ajustar cada plato

        for (const nombre in ventasPorPlato) {
            ventasPorPlato[nombre].cantidad += Math.ceil(ajuste);
            ventasPorPlato[nombre].totalVentas = ventasPorPlato[nombre].cantidad * platosArray.find(p => p.Nombre === nombre).Valor_Venta;
            ventasPorPlato[nombre].totalCostos = ventasPorPlato[nombre].cantidad * platosArray.find(p => p.Nombre === nombre).Costo;
        }
    }

    return ventasPorPlato;
};

export async function Uman(mesFormat, Informes_Categoria) {
    
    // Uman:
    //     - Margen de contribucion total (MT): margen unitario * cantidad vendida : si el Margen de contribucion total es mayor al promedio es Alto, sino Bajo
    //     - Margen de contribucion unitario (M): si el margen unitario es mayor al promedio es Alto, sino Bajo

    //     Clasificacion:

    //         - Potencial: MT Alto, M Bajo
    //         - Bandera: MT Alto, M Alto
    //         - Perdedor: MT Bajo, M Bajo
    //         - Dificil de vender: MT Bajo, M Alto

    // Obtener datos de los platos
    const platos = await Plato.findAll({
        attributes: [
            'Nombre', 
            'Cantidad_vendida', 
            [Sequelize.literal('Valor_Venta - Costo'), 'Margen_unitario'],  // Margen unitario
            [Sequelize.literal('(Valor_Venta - Costo) * Cantidad_vendida'), 'Margen_total']  // Margen total
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        },
        raw: true  // Para devolver datos como objetos planos
    });

    // Calcular el promedio de margen unitario y total
    const totalPlatos = platos.length;
    const { margenUnitarioTotal, margenTotal } = platos.reduce((acc, plato) => {
        acc.margenUnitarioTotal += Number(plato.Margen_unitario);
        acc.margenTotal += Number(plato.Margen_total);
        return acc;
    }, { margenUnitarioTotal: 0, margenTotal: 0 });

    const promedioMargen = Number((margenUnitarioTotal / totalPlatos).toFixed(2));
    const promedioMargenTotal = Number((margenTotal / totalPlatos).toFixed(2));

    // Clasificar cada plato según las reglas de Uman
    return platos.map(plato => {
        const MU = plato.Margen_unitario < promedioMargen ? 'Bajo' : 'Alto';
        const MT = plato.Margen_total < promedioMargenTotal ? 'Bajo' : 'Alto';

        // Clasificación Uman basada en las combinaciones de MU y MT
        let umanClasificacion;
        if (MT === 'Alto' && MU === 'Bajo') {
            umanClasificacion = 'Potencial';
        } else if (MT === 'Alto' && MU === 'Alto') {
            umanClasificacion = 'Bandera';
        } else if (MT === 'Bajo' && MU === 'Bajo') {
            umanClasificacion = 'Perdedor';
        } else {
            umanClasificacion = 'Dificil de vender';
        }

        return {
            Nombre: plato.Nombre,
            MU,
            MT,
            Uman: umanClasificacion
        };
    });
}

export async function Merrick(mesFormat, Informes_Categoria) {
    /*
    
    Merrick&Jones:
        - Cantidad vendida (CV): mayor al promedio es Alto, sino es Bajo
        - Margen de contribucion unitario (M): mayor al promedio es Alto, sino Bajo
        
        Clasificacion:
            - Grupo A: CV Alto, M Alto
            - Grupo B: CV Alto, M Bajo
            - Grupo C: CV Bajo, M Alto
            - Grupo D: CV Bajo, M Bajo
    
    */ 

    // Obtener datos de los platos
    const platos = await Plato.findAll({
        attributes: [
            'Nombre', 
            'Cantidad_vendida', 
            [Sequelize.literal('Valor_Venta - Costo'), 'Margen_unitario'],  // Margen unitario
            [Sequelize.literal('(Valor_Venta - Costo) * Cantidad_vendida'), 'Margen_total']  // Margen total
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        },
        raw: true  // Para devolver datos como objetos planos
    });

    // Calcular promedios de Cantidad Vendida (CV) y Margen de Contribución Unitario (M)
    const totalPlatos = platos.length;
    const { totalCantidadVendida, totalMargenUnitario } = platos.reduce((acc, plato) => {
        acc.totalCantidadVendida += Number(plato.Cantidad_vendida);
        acc.totalMargenUnitario += Number(plato.Margen_unitario);
        return acc;
    }, { totalCantidadVendida: 0, totalMargenUnitario: 0 });

    const promedioCantidadVendida = Number((totalCantidadVendida / totalPlatos).toFixed(2));
    const promedioMargenUnitario = Number((totalMargenUnitario / totalPlatos).toFixed(2));

    // Clasificar cada plato según CV y M
    return platos.map(plato => {
        const CV = plato.Cantidad_vendida > promedioCantidadVendida ? 'Alto' : 'Bajo';
        const M = plato.Margen_unitario > promedioMargenUnitario ? 'Alto' : 'Bajo';

        // Clasificación en Grupo basado en las combinaciones de CV y M
        let grupoClasificacion;
        if (CV === 'Alto' && M === 'Alto') {
            grupoClasificacion = 'Grupo A';
        } else if (CV === 'Alto' && M === 'Bajo') {
            grupoClasificacion = 'Grupo B';
        } else if (CV === 'Bajo' && M === 'Alto') {
            grupoClasificacion = 'Grupo C';
        } else {
            grupoClasificacion = 'Grupo D';
        }

        return {
            Nombre: plato.Nombre,
            CV,
            M,
            Grupo: grupoClasificacion
        };
    });
}
