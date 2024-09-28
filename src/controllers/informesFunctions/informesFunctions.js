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
        const popularidadPorcentual = porcentaje.toFixed(2);  // Redondear a 2 decimales
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

    const calcularPuntaje = (bcgCategory, costoMargen, miller, irp, indexPopularidad) => {
        let puntaje = 0;

        // Calcular puntaje según el criterio BCG
        switch (bcgCategory) {
            case 'Estrella':
                puntaje += 4;
                break;
            case 'Impopular':
                puntaje += 3;
                break;
            case 'Popular':
                puntaje += 2;
                break;
            case 'Perdedor':
                puntaje += 1;
                break;
        }

        // Calcular puntaje según CostoMargen
        switch (costoMargen) {
            case 'Selecto':
                puntaje += 4;
                break;
            case 'Estandar':
                puntaje += 3;
                break;
            case 'Durmiente':
                puntaje += 2;
                break;
            case 'Problema':
                puntaje += 1;
                break;
        }

        // Calcular puntaje según Miller
        switch (miller) {
            case 'Ganador':
                puntaje += 4;
                break;
            case 'Marginal Alto':
                puntaje += 3;
                break;
            case 'Marginal Bajo':
                puntaje += 2;
                break;
            case 'Perdedor':
                puntaje += 1;
                break;
        }

        // Calcular puntaje según IRP
        puntaje += (irp > 1) ? 4 : 1;

        // Calcular puntaje según IndexPopularidad
        puntaje += (indexPopularidad > 1) ? 4 : 1;

        return puntaje;
    };

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