import { tool, Tool } from "@openai/agents";
import { z } from 'zod';
import EventService from "../services/EventService";
import { calendar_v3 } from "googleapis";
import { DateTime } from "luxon";


const createTools = async () : Promise<Tool[]>  => {
    const tools = [];

    const toolGetEvents = tool({
        name: 'busca_eventos',
        description: 'busca todos os eventos registrados na agenda',
        parameters: z.object({}),
        execute: async () => {
            const result = await EventService.listEvents();
            return result;
        },
    });


    const toolCreateEvent = tool({
    name: 'criar_evento',
    description: 'Cria um evento no Google Calendar',
    parameters: z.object({
        summary: z.string().describe('Título do evento'),
        startDateTime: z.string().describe('Data/hora ISO de início, ex: "2025-08-07T14:00:00-03:00"'),
        endDateTime: z.string().optional().nullable().describe('Data/hora ISO de fim, opcional'),
        description: z.string().optional().nullable().describe('Descrição do evento'),
        location: z.string().optional().nullable().describe('Local do evento'),
        timeZone: z.string().optional().nullable().default('America/Sao_Paulo'),
    }),
    execute: async ({
        summary,
        startDateTime,
        endDateTime,
        description,
        location,
        timeZone,
    }) => {
        console.log("📅 Criando evento com início:", startDateTime);

        const startISO = startDateTime;
        const endISO = endDateTime ?? DateTime.fromISO(startISO, { zone: timeZone ?? 'America/Sao_Paulo' }).plus({ hours: 1 }).toISO();

        const eventData: calendar_v3.Schema$Event = {
            summary,
            description: description ?? undefined,
            location: location ?? undefined,
            start: {
                dateTime: startISO,
                timeZone: timeZone ?? 'America/Sao_Paulo',
            },
            end: {
                dateTime: endISO,
                timeZone: timeZone ?? 'America/Sao_Paulo',
            },
        };

        const result = await EventService.createEvent(eventData);
        console.log(eventData);
        return result;
    },
});

    const toolUpdateEvent = tool({
        name: 'atualizar_evento',
        description: 'Atualiza um evento existente no Google Calendar pelo ID',
        parameters: z.object({
            eventId: z.string().describe('ID do evento a ser atualizado'),
            summary: z.string().optional().nullable().describe('Novo título do evento'),
            description: z.string().optional().nullable().describe('Nova descrição do evento'),
            location: z.string().optional().nullable().describe('Novo local do evento'),
            startDateTime: z.string().optional().nullable().describe('Nova data/hora ISO de início'),
            endDateTime: z.string().optional().nullable().describe('Nova data/hora ISO de fim'),
            timeZone: z.string().optional().nullable().default('America/Sao_Paulo').describe('Fuso horário no formato IANA'),
        }),
        execute: async ({
            eventId,
            summary,
            description,
            location,
            startDateTime,
            endDateTime,
            timeZone,
        }) => {
            const updatedData: calendar_v3.Schema$Event = {};

            if (summary != null) updatedData.summary = summary;
            if (description != null) updatedData.description = description;
            if (location != null) updatedData.location = location;

            const tz = timeZone ?? 'America/Sao_Paulo';

            if (startDateTime != null) {
                updatedData.start = {
                    dateTime: startDateTime,
                    timeZone: tz,
                };

                updatedData.end = {
                    dateTime: endDateTime ?? DateTime.fromISO(startDateTime, { zone: tz }).plus({ hours: 1 }).toISO(),
                    timeZone: tz,
                };
            }

            const result = await EventService.updateEvent(eventId, updatedData);
            return result;
        },
    });




    // const toolDeleteEvent = tool({
    // name: 'deletar_evento',
    // description: 'Remove um evento do Google Calendar pelo ID',
    // parameters: z.object({
    //     eventId: z.string().describe('ID do evento que será removido'),
    // }),
    // execute: async ({ eventId }) => {
    //     const result = await EventService.deleteEvent(eventId);
    //     return result;
    // },
    // });

    tools.push(toolGetEvents);
    tools.push(toolCreateEvent);
    tools.push(toolUpdateEvent);
    // tools.push(toolDeleteEvent);

    return tools;
}

export default createTools;