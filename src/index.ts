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
        instructions: "Informe sobre o calendário e faça operações encima do calendário, como criar eventos, buscar eventos, atualizar eventos e deletar eventos",
        tools: toolsKit,
    })

    const app = express();
    app.use(json());
    app.use(cors());
    app.get('/mcp', async (req : Request, res : Response) => {

        const pergunta = req.body.pergunta;
        const respostaAI = askAgent(agent, pergunta);

        res.status(200).json({ resposta : respostaAI });
    }
    )
    const PORT = process.env.PORT;
    app.listen(PORT);
}

main();