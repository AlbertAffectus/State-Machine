import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import dotenv from 'dotenv';
import { BotRole, Transition } from './types/chat';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
};

export const checkNewTopicsInfo = async (
  query: string,
  topics: { id: string; summary: string }[],
) => {
  const systemPrompt = `
Your task is to evaluate user queries against existing topics and decide if the query introduces any new, relevant, or important information about the user. You will be provided a list of topics and a new query. Your job is to:

1. Identify any new, significant details that the query adds to existing topics.
2. Create a new topic with a descriptive lower-snake-case id if the query introduces important information not covered by any current topics.
3. Ignore details that are repetitive, irrelevant, or minor unless they meaningfully enhance a topic.
4. Only store information that is directly useful for future interactions with the user or for better understanding their needs and preferences.
`;
  const responseSchema = z.object({
    topic_updates: z.array(
      z.object({
        topic_id: z.string(),
        topic_content: z.string(),
      }),
    ),
  });
  const prompt = `Given the following topics:\n${topics.map((topic) => `- ID: ${topic.id} CONTENT: ${topic.summary}`).join('\n')}\nDoes the query "${query}" provide any new information about any of these topics? Answer with topic IDs that have new information as well as the topic content updated with the new information.`;

  const response = await client.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(responseSchema, 'topics'),
  });
  const res = response.choices[0]?.message.parsed as {
    topic_updates: { topic_id: string; topic_content: string }[];
  };

  return res.topic_updates;
};

export const getNextBotState = async (
  transcript: string,
  transitionRules: Transition,
): Promise<BotRole> => {
  const prompt = `Given the following conversation transcript:\n\n${transcript}\n\nHere are the possible state transitions:\n\n${Array.from(
    transitionRules.entries(),
  )
    .map(([role, rule]) => `- ${role}: ${rule}`)
    .join(
      '\n',
    )}\n\nBased on the conversation, which state should the bot transition to?`;

  const systemPrompt = `You are an intelligent assistant tasked with managing the conversation flow based on the user's behavior, intent, and prior interactions. Your goal is to transition the bot into the appropriate state by analyzing the provided conversation transcript (chat log) and considering any relevant topics or patterns that have emerged from past interactions with the user.

  When determining the next state, you must evaluate the transition rules carefully. These rules are designed to guide the conversation flow based on user behavior, emotional cues, and the context of the discussion. You will receive a list of possible transitions, where each state transition is associated with a condition (rule) that must be fulfilled.

  The user's conversation history may include valuable insights such as recurring emotional themes, areas of uncertainty or self-doubt, and specific topics that the user has shown interest in previously. Utilize this knowledge to understand the user's objectives and intent in the current conversation, and ensure the bot transitions to a state that best matches the user's current needs.

  For each transition state, thoroughly assess whether the conditions of the transition rule are met given the conversation context and the user's past interaction data. Return the bot state that satisfies these conditions most accurately and helps guide the user effectively.`;

  const responseSchema = z.object({
    bot_state: z.enum([
      Object.values(BotRole)[0],
      ...Object.values(BotRole).map(String),
    ]),
  });

  const response = await client.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(responseSchema, 'bot_state'),
  });

  return response.choices[0]?.message.parsed?.bot_state as BotRole;
};
