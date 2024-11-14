import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ChatLog from './models/chatModel';
import type { ChatRequest, Message } from './types/chat';
import { processTopics } from './topicsProcessor';
import { processBotState } from './stateProcessor';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI as string, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.post('/chat', async (req: Request, res: Response) => {
  try {
    const chatReq: ChatRequest = req.body;
    let chatLog;
    if (!chatReq.chat_log) {
      chatLog = new ChatLog({
        id: uuidv4(),
        user_id: chatReq.user_id,
        messages: [],
      });
    } else {
      chatLog = await ChatLog.findOne({
        user_id: chatReq.user_id,
        id: chatReq.chat_log?.id,
      });
    }

    if (!chatLog) {
      res.status(404).json({ error: 'Could not find or create chat log' });
      return;
    }

    const newMessage: Message = {
      id: String((chatReq.chat_log?.messages || []).length + 1),
      timestamp: new Date(),
      text: chatReq.query,
      role: 'User',
    };

    chatLog.messages.push(newMessage);
    await chatLog.save();

    const relevantTopics = await processTopics(
      chatReq.user_id,
      newMessage,
      (chatReq.chat_log?.messages || []).length,
      chatLog.id,
    );

    const nextBotState = await processBotState(
      [...(chatReq.chat_log?.messages || []), newMessage],
      relevantTopics,
    );

    res.status(200).json({
      message: 'Chat log and bot state updated successfully',
      bot_state: nextBotState,
      relevantTopics,
      chat_log: { id: chatLog.id, messages: chatLog.messages },
    });
  } catch (error) {
    console.error('Error handling chat request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default app;
