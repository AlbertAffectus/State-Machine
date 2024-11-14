import { Document, model, Schema } from 'mongoose';
import type { Message } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

const MessageSchema = new Schema<Message>({
  id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  text: { type: String, required: true },
  role: { type: String, required: true },
});

const ChatSchema = new Schema({
  _id: { type: String, required: true, default: () => uuidv4() },
  user_id: { type: String, required: true },
  messages: [MessageSchema],
});

export interface IChatLog extends Document {
  id: string;
  user_id: string;
  messages: {
    id: string;
    timestamp: Date;
    text: string;
    role: string;
  }[];
}

export default model<IChatLog>('ChatLog', ChatSchema);
