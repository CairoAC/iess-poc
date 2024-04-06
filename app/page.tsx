"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

type ChatMessage = {
  from: 'AI' | 'Humano';
  text: string;
};

export default function Home() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    const newMessage: ChatMessage = { from: 'Humano', text: userInput };
    setChatMessages([...chatMessages, newMessage]);

    try {
      const response = await fetch('/api/initialize-dialogflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userInput }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem.');
      }

      const data = await response.json();
      if (data.messages && Array.isArray(data.messages)) {
        const aiMessages: ChatMessage[] = data.messages.map((text: string) => ({
          from: 'AI',
          text: text,
        }));
        setChatMessages(currentMessages => [...currentMessages, ...aiMessages]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }

    setUserInput('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center">
      <Card className="w-[440px] h-[700px] grid grid-rows-[min-content_1fr_min-content]">
        <CardHeader>
          <CardTitle>IESS Chat AI</CardTitle>
          <CardDescription>¡Agenda tu consulta!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto">
          {chatMessages.map((msg, index) => (
            <div key={index} className="flex gap-3 text-slate-600 text-sm">
              <Avatar>
                <AvatarFallback>{msg.from === 'AI' ? 'AI' : 'JD'}</AvatarFallback>
                <AvatarImage src={msg.from === 'AI' ? "chatbot-icon.png" : "human-icon.png"} />
              </Avatar>
              <p className="leading-relaxed">
                <span className="block font-bold text-slate-700">{msg.from}:</span>
                {msg.text}
              </p>
            </div>
          ))}
        </CardContent>

        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full space-x-3">
            <Input
              placeholder="¿Cómo puedo ayudarte?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Enviar</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
