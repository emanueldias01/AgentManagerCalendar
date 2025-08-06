import { Agent, run } from "@openai/agents"

const askAgent = async (agent : Agent, prompt : string) => {
    const agora = new Date();

    const dataAtual = agora.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
    });

    const horaAtual = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo',
    });

    const response = await run(
        agent,
        `${prompt}. Tenha noção da data e horário atual: ${dataAtual} ${horaAtual}.`
    );

    return response.finalOutput;
}

export default askAgent;