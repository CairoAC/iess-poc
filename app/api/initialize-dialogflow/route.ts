import { SessionsClient, } from "@google-cloud/dialogflow-cx"
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { query, languageCode = 'es' } = await req.json();

  const projectId = "iess-chatbot";
  const location = "us-central1";
  const agentId = "7064b4f8-d7d0-4d60-9fb0-d6559177500a";
  const sessionId = Math.random().toString(36).substring(7);
  const client = new SessionsClient({ apiEndpoint: `${location}-dialogflow.googleapis.com` });
  const sessionPath = client.projectLocationAgentSessionPath(projectId, location, agentId, sessionId);

  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode,
    },
  };

  try {
    const [response] = await client.detectIntent(dialogflowRequest);

    if (!response.queryResult) {
      return new NextResponse(JSON.stringify({ error: "Não contém um queryResult" }), { status: 500, headers: { 'Content-Type': 'application/json', }, });
    }

    const messages = response.queryResult.responseMessages?.map(msg => msg.text?.text).filter(Boolean);
    return new NextResponse(JSON.stringify({ messages }), { status: 200, headers: { 'Content-Type': 'application/json', }, });
  } catch (error) {
    console.error('Erro ao acessar o Dialogflow CX:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao se conectar ao Dialogflow CX' }), { status: 500, headers: { 'Content-Type': 'application/json', }, });
  }
}