import { BotRole, botTransitions, Message, Transition } from './types/chat';
import { getNextBotState } from './chatGptAdapter';
import { Topic } from './types/user';

export const getTransitionRules = (currentRole: BotRole): Transition => {
  return botTransitions[currentRole] || new Map();
};

const generateTranscript = (messages: Message[], topics: Topic[]): string => {
  let transcript = 'Conversation transcript:\n';
  messages.forEach((message) => {
    transcript += `${message.role}: ${message.text}\n`;
  });

  if (topics.length) {
    transcript += '\nRelevant Topics:\n';
    topics.forEach((topic) => {
      transcript += `- ${topic.summary}\n`;
    });
  }

  return transcript;
};

export const processBotState = async (messages: Message[], topics: Topic[]) => {
  console.log('Processing bot state');
  const lastBotMessage = messages.reverse().find((msg) => msg.role !== 'User');
  const currentRole = (lastBotMessage?.role as BotRole) || BotRole.e0;

  const transitionRules = getTransitionRules(currentRole);
  const transcript = generateTranscript(messages, topics);
  const nextRole = await getNextBotState(transcript, transitionRules);

  console.log(`Bot transitioning from ${currentRole} to ${nextRole}`);

  return nextRole;
};
