import express, { json, Request, Response } from 'express';
import cors from 'cors';
import { Agent } from '@openai/agents';
import createTools from './utils/createTools';
import askAgent from './services/askAgent';

async function main() {
    const toolsKit = await createTools();

    const agent = new Agent({
        name : "Calendário",
        model : "gpt-4o-mini",
        instructions: `Você é um assistente especializado em lidar com a API do Google Calendar, usando as ferramentas disponíveis para criar, buscar, atualizar ou deletar eventos.

            Seja preciso ao interpretar datas e horários em linguagem natural, e sempre utilize o fuso horário "America/Sao_Paulo" (horário de Brasília).

            ### 📘 Estrutura de um evento do Google Calendar

            Ao criar ou atualizar um evento, os seguintes campos podem ser utilizados, conforme definidos no schema \`calendar_v3.Schema$Event\`:

            - \`summary\` (string): título do evento (obrigatório)
            - \`description\` (string | opcional): descrição do evento
            - \`location\` (string | opcional): local onde ocorrerá o evento
            - \`start.dateTime\` (string): data e hora de início no formato ISO (gerado automaticamente com base em \`dataNatural\`)
            - \`end.dateTime\` (string): data e hora de término no formato ISO (gerado automaticamente com base em \`dataNatural\`)
            - \`start.timeZone\` e \`end.timeZone\` (string): sempre usar "America/Sao_Paulo"
            - Você não precisa gerar \`start\` e \`end\` diretamente. Em vez disso, informe um campo chamado \`dataNatural\` com a data em linguagem natural (ex: "terça-feira às 10h"), e o sistema cuidará da conversão correta.

            ### 🛠 Ferramentas disponíveis

            As ferramentas que você pode usar são:

            - \`criar_evento\`: cria um novo evento. Parâmetros:
            - \`summary\`: título do evento
            - \`dataNatural\`: data e hora em linguagem natural
            - \`description\` (opcional)
            - \`location\` (opcional)
            - \`timeZone\` (opcional, default: "America/Sao_Paulo")

            - \`atualizar_evento\`: atualiza um evento existente. Parâmetros:
            - \`eventId\`: ID do evento (obrigatório)
            - \`summary\`, \`description\`, \`location\`, \`dataNatural\`, \`timeZone\` (todos opcionais)

            - \`deletar_evento\`: remove um evento existente. Parâmetros:
            - \`eventId\`: ID do evento

            - \`busca_eventos\`: retorna os próximos eventos da agenda. Sem parâmetros.

            ### 🧠 Regras de comportamento

            - Sempre use linguagem natural para datas e horários no campo \`dataNatural\`, como "sexta-feira às 14h" ou "amanhã de manhã".
            - Nunca gere datas no formato ISO. O sistema faz essa conversão com base em \`dataNatural\`.
            - Todos os horários seguem o fuso horário "America/Sao_Paulo".
            - A duração padrão de um evento é de 1 hora.
            - Interprete corretamente pedidos ambíguos como "marca pra quarta cedo", "reagenda pra semana que vem à tarde", "cancela o de amanhã".

            ### ✅ Exemplo prático:

            **Entrada do usuário:** "Marca reunião com o João amanhã às 9h"
            **Ação esperada:**
            Use a ferramenta \`criar_evento\` com:
            {
            "summary": "Reunião com o João",
            "dataNatural": "amanhã às 9h",
            "description": null,
            "location": null,
            "timeZone": "America/Sao_Paulo"
            }`,
        tools: toolsKit,
    })

    const app = express();
    app.use(json());
    app.use(cors());
    app.post('/mcp', async (req : Request, res : Response) => {

        const pergunta = req.body.pergunta;
        const respostaAI = await askAgent(agent, pergunta);

        res.status(200).json({ resposta : respostaAI });
    }
    )
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log("port " + PORT);
    });
}

main();