import { checkNewTopicsInfo, generateEmbedding } from './chatGptAdapter';
import { fetchRelevantTopics, updateTopic } from './pineconeAdapter';
import TopicModel from './models/topicModel';
import { Message } from './types/chat';
import { Topic } from './types/user';

export const processTopics = async (
  user_id: string,
  msg: Message,
  msg_idx: number,
  chat_id: string,
): Promise<Topic[]> => {
  try {
    const queryEmbedding = await generateEmbedding(msg.text);

    const relevantTopics = await fetchRelevantTopics(user_id, queryEmbedding);

    if (!relevantTopics.length) {
      console.log('No relevant topics found.');
      return [];
    }

    const newInfoDetected = await checkNewTopicsInfo(
      msg.text,
      relevantTopics.map((topic) => ({
        id: topic.id?.toString() || '',
        summary: topic.summary?.toString() || '',
      })),
    );

    if (newInfoDetected.length > 0) {
      for (const topicUpdate of newInfoDetected) {
        if (topicUpdate.topic_id === 'new') {
          const newTopic = new TopicModel({
            summary: topicUpdate.topic_content,
            evidence: [{ chat_id, message_indecies: [msg_idx] }],
          });
          await newTopic.save();
        }
        const existingTopic = await TopicModel.findById(topicUpdate.topic_id);
        if (existingTopic) {
          existingTopic.summary = topicUpdate.topic_content;
          existingTopic.evidence.push({ chat_id, message_indecies: [msg_idx] });
          await existingTopic.save();

          await updateTopic(topicUpdate.topic_id, topicUpdate.topic_content);
        }
      }
    }

    const topicsWithEvidence: Topic[] = relevantTopics.map((topic) => ({
      id: topic.id?.toString() || '',
      summary: topic.summary?.toString() || '',
      evidence: [],
    }));

    return topicsWithEvidence;
  } catch (error) {
    console.error('Error processing topics:', error);
    return [];
  }
};
