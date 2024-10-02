import Plato from "../../dao/models/Plate.js";
import { Sequelize, Op } from "sequelize";


export const executeInform = async (mesFormat, Informes_Categoria) => {
    console.time('createInform')

    const data = await Plato.findAll({
        attributes: [
            'Nombre',
            'Valor_Venta',  
            'Cantidad_vendida',
            'Costo',
            'Dias_en_carta'
        ],
        where: {
            Mes_plato: mesFormat,
            Categoria: Informes_Categoria
        },
        raw: true  
    })

    
    const Nombres = data.map(item => item.Nombre);
    const Valor_Venta = data.map(item => Number(item.Valor_Venta));
    const Cantidad_vendida = data.map(item => Number(item.Cantidad_vendida));
    const Costos = data.map(item => Number(item.Costo));
    const Dias_en_carta = data.map(item => Number(item.Dias_en_carta));
    const MargenTotal = [];
    const VentasTotales = [];
    const Rentabilidad = [];

    const cantidadPlatos = Nombres.length

    // Iterar sobre los arrays originales y calcular los nuevos valores
    for (let i = 0; i < Valor_Venta.length; i++) {
        const rentabilidad = (Valor_Venta[i].toFixed(2)) - (Costos[i].toFixed(2)); 
        const margenTotal = (Cantidad_vendida[i].toFixed(2)) * (rentabilidad.toFixed(2));
        const ventasTotales = (Cantidad_vendida[i].toFixed(2)) * (Valor_Venta[i].toFixed(2)); 

        Rentabilidad.push(Number(rentabilidad.toFixed(2)));
        MargenTotal.push(Number(margenTotal.toFixed(2)));
        VentasTotales.push(Number(ventasTotales.toFixed(2)));
    }

    const sumarArray = (array) => array.reduce((acumulador, valorActual) => acumulador + valorActual, 0);

    const SumaMargenTotal = sumarArray(MargenTotal);
    const SumaVentasTotales = sumarArray(VentasTotales);
    const SumaCantidadVendida = sumarArray(Cantidad_vendida);
    const SumaDiasCarta = sumarArray(Dias_en_carta);
    const SumaCostos = sumarArray(Costos);
    const SumaRentabilidad = sumarArray(Rentabilidad);
    

    const omnesResult = await omnesFunction(Valor_Venta, Cantidad_vendida) 
    const BCGResults = await BCGPop(data) 
    const ADLResults = await ADL(data, Cantidad_vendida, Rentabilidad) 
    const IRPResults = await IRP(data, MargenTotal, VentasTotales, SumaMargenTotal, SumaVentasTotales) 
    const IndexPopularidadResults = await IndexPopularidad(data, SumaCantidadVendida, SumaDiasCarta) 
    const CostoMargenAnalysisResults = await CostoMargenAnalysis(data, cantidadPlatos, MargenTotal, SumaCostos, SumaMargenTotal); 
    const MillerResults = await Miller(data, cantidadPlatos, SumaCostos, SumaCantidadVendida); 
    const umanResults = await Uman(data, Rentabilidad, MargenTotal, SumaRentabilidad, SumaMargenTotal, cantidadPlatos) 
    const merrickResults = await Merrick(data, Rentabilidad, SumaCantidadVendida, SumaRentabilidad, cantidadPlatos) 

    const multiCriterioObject = {
        BCGResults,
        CostoMargenAnalysisResults,
        MillerResults,
        IRPResults,
        IndexPopularidadResults,
    }

    //actualizar multiCriterioResults, al parecer ya no usa IndexPopularida ni IRP y los reemplaza por Uman y Merrick
    const multiCriterioResults = multiCriterioFunction(multiCriterioObject) //los puntajes detallados
    const multiCriterioFinal = multiCriterioResultsOnly(multiCriterioResults) //solo los puntajes


    const result = {
        omnesResult, 
        BCGResults,
        ADLResults, 
        IRPResults,
        IndexPopularidadResults,
        CostoMargenAnalysisResults,
        MillerResults,
        umanResults, 
        merrickResults, 
        multiCriterioResults, 
        multiCriterioFinal
    } 
    
    console.timeEnd('createInform')
    return result
}


export const omnesFunction = async (Valor_Venta, Cantidad_vendida) => {     
    //1er principio    

    const VA = Math.max(...Valor_Venta) 
    const VB = Math.min(...Valor_Venta) 
    const cantidadPlatos = Valor_Venta.length 
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
    const AmplitudGama = Number(((VA - VB) / 3).toFixed(2));
    const Z1 = [VB, VB + AmplitudGama]
    const Z2 = [VB + AmplitudGama, VB + (2* AmplitudGama)]
    const Z3 = [VB + (2* AmplitudGama), VB + (3 * AmplitudGama)]
    
    const definePlatosZones = (elementos, rango) => {
        return elementos.filter(elemento => elemento >= rango[0] && elemento < rango[1]).length;
    };

    const platosZ1 = await definePlatosZones(Valor_Venta, Z1)
    const platosZ2 = await definePlatosZones(Valor_Venta, Z2)
    const platosZ3 = await definePlatosZones(Valor_Venta, Z3)

    const cumpleOmnes1 = platosZ1 + platosZ3 === platosZ2 ? "Cumple" : "No cumple"

    //2do principio

    const apertura2 = VA / VB
    const cumpleOmnes2 = cantidadPlatos <= 9 ? (apertura2 <= 2.5 ? 'Cumple' : 'No cumple') : (apertura2 <= 3 ? 'Cumple' : 'No cumple')

    // 3er principio: -1 significa menor a 0.85, 0 significa entre 0.85 y 1.05, 1 significa mas de 1.05
    const PMP = sumaTotalVentas / sumaCantidadVendida
    const PMO = sumaValorVenta / cantidadPlatos

    // const cumpleOmnes3 = PMP / PMO < 0.85 ? -1 : ((PMP / PMO >= 0.85 && PMP / PMO <= 1.05) ? 0 : 1)
    
    const cumpleOmnes3 = Number((PMP / PMO).toFixed(2))

//4to principio

    const cumpleOmnes4 = `Promoción debe ser menor a ${Number(PMP.toFixed(2))}`

    const omnesResult = {
        '1 principio': cumpleOmnes1,
        '2 principio': cumpleOmnes2,
        '3 principio': cumpleOmnes3,
        '4 principio': cumpleOmnes4
    }

    return omnesResult
}


//Corregir BCG, es por la cantidad promedio, no por 10%
export async function BCGPop(data) {
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

    const rentabilidadPorPlato = {};
    let sumaCantidadVendida = 0;
    
    data.forEach(plato => {
        const cantidadVendida = plato.Cantidad_vendida;
        const nombrePlato = plato.Nombre;
        const valorVenta = plato.Valor_Venta;
        const costoUnitario = plato.Costo;
    
        const rentabilidad = valorVenta - costoUnitario;
    
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

export async function ADL(data, Cantidad_vendida, Rentabilidad) {
    /*
    3er informe: ADL
     
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
    

    const CVA = Math.max(...Cantidad_vendida)
    const CVB = Math.min(...Cantidad_vendida)
    const maxRent = Math.max(...Rentabilidad)
    const minRent = Math.min(...Rentabilidad)


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

    const resultado = {};
    data.forEach((plato, index) => {
        const nombre = plato.Nombre;
        const rentabilidad = Rentabilidad[index];
        const cantidadVendida = plato.Cantidad_vendida;

        // Determinar la categoría de Rentabilidad
        let rentabilidadCategoria;
        switch (true) {
            case (rentabilidad < Crecimiento[1]):
                rentabilidadCategoria = 'Declinacion';
                break;
            case (rentabilidad < Introduccion[1]):
                rentabilidadCategoria = 'Introduccion';
                break;
            case (rentabilidad < Madurez[1]):
                rentabilidadCategoria = 'Crecimiento';
                break;
            default:
                rentabilidadCategoria = 'Madurez';
                break;
        }

        // Determinar la categoría de Cantidad Vendida
        let cantidadVendidaCategoria;
        switch (true) {
            case (cantidadVendida >= Dominante[0] && cantidadVendida <= Dominante[1]):
                cantidadVendidaCategoria = 'Dominante';
                break;
            case (cantidadVendida >= Fuerte[0] && cantidadVendida <= Fuerte[1]):
                cantidadVendidaCategoria = 'Fuerte';
                break;
            case (cantidadVendida >= Favorable[0] && cantidadVendida <= Favorable[1]):
                cantidadVendidaCategoria = 'Favorable';
                break;
            case (cantidadVendida >= Debil[0] && cantidadVendida <= Debil[1]):
                cantidadVendidaCategoria = 'Debil';
                break;
            default:
                cantidadVendidaCategoria = 'Marginal';
                break;
        }

        resultado[nombre] = {
            rentabilidadCategoria,
            rentabilidadPuntaje: rentabilidad,
            cantidadVendidaCategoria,
            cantidadVendidaPuntaje: cantidadVendida

        };
    }); 

    return resultado

}

export const IRP = async (data, MargenTotal, VentasTotales, sumaMargenTotal, sumaVentasTotales) => {
    /* 4to informe: IRP

    IRP = % de margen / % de venta
    Mayor a 1 o menor a 1.
    */ 

    const resultado = {};
    data.forEach((plato, index) => {
        const nombre = plato.Nombre;
        const margenTotal = MargenTotal[index];
        const ventasTotales = VentasTotales[index];

        // Calcular el porcentaje de margen y ventas totales
        const porcentajeMargen = Number(((margenTotal / sumaMargenTotal) * 100).toFixed(2));
        const porcentajeVentas = Number(((ventasTotales / sumaVentasTotales) * 100).toFixed(2));

        // Guardar ambos valores en un array
        const IRPFinal = Number((porcentajeMargen / porcentajeVentas).toFixed(2))
        resultado[nombre] = IRPFinal;
    });
    return resultado;
}

export const IndexPopularidad = async (data, sumaCantidadVendidaTotal, sumaDiasEnCartaTotal) => {

    const resultado = {};
    data.forEach(plato => {
        const nombre = plato.Nombre;
        const cantidadVendida = parseFloat(plato.Cantidad_vendida);
        const diasEnCarta = parseFloat(plato.Dias_en_carta);

        // Calcular los porcentajes
        const porcentajeCantidadVendida = Number(((cantidadVendida / sumaCantidadVendidaTotal) * 100).toFixed(2));
        const porcentajeDiasEnCarta = Number(((diasEnCarta / sumaDiasEnCartaTotal) * 100).toFixed(2));

        // Guardar ambos porcentajes en el objeto resultado
        const IPFinal = Number((porcentajeCantidadVendida / porcentajeDiasEnCarta).toFixed(2))
        resultado[nombre] = IPFinal;
    });

    return resultado;
}

export const CostoMargenAnalysis = async (data, cantidadPlatos, MargenTotal, sumaCostos, sumaMargenes) => {
    const costoPromedio = sumaCostos / cantidadPlatos;
    const margenPromedio = sumaMargenes / cantidadPlatos;

    const resultado = {};
    data.forEach((plato, index) => {
        const nombre = plato.Nombre;
        const costo = parseFloat(plato.Costo);
        const margen = parseFloat(MargenTotal[index]);

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

        resultado[nombre] = {
            costoPonderado: costoPonderado, 
            margenContribucionPonderado: mcp, 
            costoMargen: cma
        };
    });
    return resultado;
};

export const Miller = async (data, cantidadPlatos, sumaCostos, sumaCantidadVendida) => {
    const costoPromedio = sumaCostos / cantidadPlatos;
    const cantidadVendidaPromedio = sumaCantidadVendida / cantidadPlatos;

    
    const resultado = {};
    data.forEach(plato => {
        const nombre = plato.Nombre;
        const costo = parseFloat(plato.Costo);
        const cantidadVendida = parseFloat(plato.Cantidad_vendida);

        // Determinar atributos basados en promedios
        const costoAlimentos = costo < costoPromedio ? "Bajo" : "Alto";
        const cantidadVendidaAtributo = cantidadVendida < cantidadVendidaPromedio ? "Bajo" : "Alto";

        // Determinar el atributo MM (Miller Matrix)
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

        resultado[nombre] = {
            costoAlimentos: costoAlimentos, 
            cantidadVendidaAtributo: cantidadVendidaAtributo, 
            millerMatrix: mm
        };
    });


    return resultado;
};

export const multiCriterioFunction = (multiCriterio) => {
    
    //Agregar Uman y Merrick
    //Eliminar IRP e IndexPopularidad
    
    const resultadosArray = [];

    const nombresPlatos = Object.keys(multiCriterio.BCGResults);
    
    nombresPlatos.forEach(nombrePlato => {
        const bcgCategory = multiCriterio.BCGResults[nombrePlato].BCGCategory;
        const costoMargen = multiCriterio.CostoMargenAnalysisResults[nombrePlato].costoMargen; // CMA
        const miller = multiCriterio.MillerResults[nombrePlato].millerMatrix; // MM
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

//Por arreglar, usar Excel
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

export async function Uman(data, Rentabilidad, MargenTotal, SumaRentabilidad, SumaMargenTotal, cantidadPlatos) {
    
    // Uman:
    //     - Margen de contribucion total (MT): margen unitario * cantidad vendida : si el Margen de contribucion total es mayor al promedio es Alto, sino Bajo
    //     - Margen de contribucion unitario (M): si el margen unitario es mayor al promedio es Alto, sino Bajo

    //     Clasificacion:

    //         - Potencial: MT Alto, M Bajo
    //         - Bandera: MT Alto, M Alto
    //         - Perdedor: MT Bajo, M Bajo
    //         - Dificil de vender: MT Bajo, M Alto

    const promedioMargen = Number((SumaRentabilidad / cantidadPlatos).toFixed(2));
    const promedioMargenTotal = Number((SumaMargenTotal / cantidadPlatos).toFixed(2));

    const resultado = {}
    data.map((plato, index) => {
        const MU = Rentabilidad[index] < promedioMargen ? 'Bajo' : 'Alto';
        const MT = MargenTotal[index] < promedioMargenTotal ? 'Bajo' : 'Alto';

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
        

        resultado[plato.Nombre] = {
            margenUnitario: MU,
            margenTotal: MT,
            Uman: umanClasificacion
        };
    });

    return resultado
}

export async function Merrick(data, Rentabilidad, SumaCantidadVendida, SumaRentabilidad, cantidadPlatos) {
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
    
    const promedioCantidadVendida = Number((SumaCantidadVendida / cantidadPlatos).toFixed(2));
    const promedioMargenUnitario = Number((SumaRentabilidad / cantidadPlatos).toFixed(2));

    const resultado = {}
    data.map((plato, index) => {
        const CV = plato.Cantidad_vendida > promedioCantidadVendida ? 'Alto' : 'Bajo';
        const M = Rentabilidad[index] > promedioMargenUnitario ? 'Alto' : 'Bajo';

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
    
       resultado[plato.Nombre] = {
            cantidadVendida: CV,
            margenUnitario: M,
            Merrick: grupoClasificacion
       }


    });

    return resultado
}
