import { Chat, Chunk } from './chat';

export type User = {
  id: string;
  name: string;
  chats: Chat[];
};

export type Topic = {
  id: string;
  summary: string;
  evidence: Chunk[];
};

export type Topics = {
  id: string;
  summary: string;
  topics: Topic[];
};
