export default function convertToMonthYear(input) {
    // Definir el año
    const year = 2024;

    // Definir los nombres de los meses
    const monthNames = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    // Convertir el string a un número y restar 1 para obtener el índice del mes
    const monthIndex = parseInt(input) - 1;

    // Verificar si el mes es válido (0-11)
    if (monthIndex >= 0 && monthIndex < monthNames.length) {
        return `${monthNames[monthIndex]}-${year}`;
    } else {
        throw new Error('Mes no válido');
    }
}