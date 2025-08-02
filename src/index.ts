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
        instructions: "Interprete a intenção do usuário e gere os dados para executar ferramentas como criar, buscar ou atualizar eventos.",
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