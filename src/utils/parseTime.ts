import * as chrono from 'chrono-node';

export function parseDataNatural(texto: string): { startDateTime: string, endDateTime: string } {
    const dataInicio = chrono.pt.parseDate(texto);

    if (!dataInicio) {
        throw new Error("Não foi possível interpretar a data.");
    }

    const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // adiciona 1 hora

    return {
        startDateTime: dataInicio.toISOString(), // "2025-08-03T14:00:00.000Z"
        endDateTime: dataFim.toISOString()
    };
}
