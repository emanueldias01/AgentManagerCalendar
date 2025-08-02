import { Agent, run } from "@openai/agents"

const askAgent = async (agent : Agent, prompt : string) => {
    const response = await run(agent, prompt);
    return response.finalOutput;
}

export default askAgent;