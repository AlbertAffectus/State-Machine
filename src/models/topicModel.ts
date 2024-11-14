import { Schema, model, Document } from 'mongoose';
import { Chunk } from '../types/chat';

export interface ITopic extends Document {
  id: string;
  user_id: string;
  summary: string;
  evidence: Chunk[];
}

const topicSchema = new Schema<ITopic>({
  id: { type: String, required: true },
  summary: { type: String, required: true },
  evidence: [{ chat_id: String, message_indecies: [Number] }],
});

export default model<ITopic>('Topic', topicSchema);
