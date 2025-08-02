import { tool, Tool } from "@openai/agents";
import * as chrono from 'chrono-node';
import { z } from 'zod';
import EventService from "../services/EventService";
import { calendar_v3 } from "googleapis";
import { parseDataNatural } from "./parseTime";


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
        dataNatural: z.string().describe('Data e hora em linguagem natural, ex: "amanhã às 14h"'),
        description: z.string().optional().nullable().describe('Descrição do evento'),
        location: z.string().optional().nullable().describe('Local do evento'),
        timeZone: z.string().optional().nullable().default('America/Sao_Paulo'),
    }),
    execute: async ({
        summary,
        dataNatural,
        description,
        location,
        timeZone,
    }) => {
        const { startDateTime, endDateTime } = parseDataNatural(dataNatural);

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
        dataNatural: z.string().optional().nullable().describe('Nova data e hora do evento em linguagem natural, ex: "próxima segunda às 10h"'),
        timeZone: z.string().optional().nullable().default('America/Sao_Paulo').describe('Fuso horário no formato IANA'),
    }),
    execute: async ({
        eventId,
        summary,
        description,
        location,
        dataNatural,
        timeZone,
    }) => {
        const updatedData: calendar_v3.Schema$Event = {};

        if (summary != null) updatedData.summary = summary;
        if (description != null) updatedData.description = description;
        if (location != null) updatedData.location = location;

        const tz = timeZone ?? 'America/Sao_Paulo';

        if (dataNatural != null) {
        const dataInicio = chrono.pt.parseDate(dataNatural);
        if (!dataInicio) throw new Error("Não foi possível interpretar a data/hora fornecida.");

        const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // +1 hora

        updatedData.start = {
            dateTime: dataInicio.toISOString(),
            timeZone: tz,
        };

        updatedData.end = {
            dateTime: dataFim.toISOString(),
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