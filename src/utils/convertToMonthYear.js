export default function convertToMonthYear(input) {
    // Definir el año
    const year = 2024;

    const monthNames = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    const monthIndex = parseInt(input) - 1;

    if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < monthNames.length) {
        return `${monthNames[monthIndex]}-${year}`;
    } else {
        // En lugar de lanzar un error, puedes retornar un mensaje o valor por defecto
        return 'Mes no válido';
    }
}