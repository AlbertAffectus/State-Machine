import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { generateEmbedding } from './chatGptAdapter';

dotenv.config();

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

export const fetchRelevantTopics = async (
  user_id: string,
  queryEmbedding: number[],
) => {
  const index = pineconeClient.Index(
    process.env.PINECONE_TOPICS_INDEX as string,
  );
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 3,
    includeValues: true,
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => ({
    id: match.metadata?.topic_id,
    summary: match.metadata?.summary,
  }));
};

export const updateTopic = async (topic_id: string, topic_content: string) => {
  try {
    const index = pineconeClient.Index(
      process.env.PINECONE_TOPICS_INDEX as string,
    );
    const newEmbedding = await generateEmbedding(topic_content);

    const upsertPayload = {
      id: topic_id,
      values: newEmbedding,
      metadata: {
        summary: topic_content,
      },
    };

    const response = await index.upsert([upsertPayload]);

    console.log(`Successfully updated topic ${topic_id} in Pinecone.`);
    return response;
  } catch (error) {
    console.error('Error updating topic in Pinecone:', error);
    throw new Error('Failed to update topic');
  }
};
