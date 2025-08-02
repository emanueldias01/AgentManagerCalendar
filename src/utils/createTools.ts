import { tool, Tool } from "@openai/agents";
import { z } from 'zod';
import EventService from "../services/EventService";
import { calendar_v3 } from "googleapis";


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
        description: z.string().optional().nullable().describe('Descrição do evento'),
        location: z.string().optional().nullable().describe('Local do evento'),
        startDateTime: z.string().describe('Início no formato ISO ex: 2025-08-05T10:00:00-03:00'),
        endDateTime: z.string().describe('Fim no formato ISO ex: 2025-08-05T11:00:00-03:00'),
        timeZone: z.string().optional().nullable().default('America/Sao_Paulo'),
    }),
    execute: async ({
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        timeZone,
    }) => {
        const eventData = {
        summary,
        description: description ?? undefined,
        location: location ?? undefined,
        start: {
            dateTime: startDateTime,
            timeZone: timeZone ?? 'America/Sao_Paulo',
        },
        end: {
            dateTime: endDateTime,
            timeZone: timeZone ?? 'America/Sao_Paulo',
        },
        };

        const result = await EventService.createEvent(eventData);
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
        startDateTime: z.string().optional().nullable().describe('Nova data/hora de início no formato ISO'),
        endDateTime: z.string().optional().nullable().describe('Nova data/hora de término no formato ISO'),
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
        }

        if (endDateTime != null) {
        updatedData.end = {
            dateTime: endDateTime,
            timeZone: tz,
        };
        }

        const result = await EventService.updateEvent(eventId, updatedData);
        return result;
    },
    });


    const toolDeleteEvent = tool({
    name: 'deletar_evento',
    description: 'Remove um evento do Google Calendar pelo ID',
    parameters: z.object({
        eventId: z.string().describe('ID do evento que será removido'),
    }),
    execute: async ({ eventId }) => {
        const result = await EventService.deleteEvent(eventId);
        return result;
    },
    });

    tools.push(toolGetEvents);
    tools.push(toolCreateEvent);
    tools.push(toolUpdateEvent);
    tools.push(toolDeleteEvent);

    return tools;
}

export default createTools;