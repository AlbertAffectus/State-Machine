import { processTopics } from '../topicsProcessor';
import { generateEmbedding, checkNewTopicsInfo } from '../chatGptAdapter';
import { fetchRelevantTopics, updateTopic } from '../pineconeAdapter';
import TopicModel from '../models/topicModel';
import { Message } from '../types/chat';

jest.mock('../chatGptAdapter');
jest.mock('../pineconeAdapter');
jest.mock('../models/topicModel');

describe('processTopics', () => {
  const user_id = 'user123';
  const chat_id = 'chat123';
  const msg_idx = 1;
  const msg: Message = {
    id: '1',
    timestamp: new Date(),
    text: 'Hello',
    role: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should not process topics when no relevant topics are found', async () => {
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (fetchRelevantTopics as jest.Mock).mockResolvedValue([]);

    const consoleSpy = jest.spyOn(console, 'log');

    await processTopics(user_id, msg, msg_idx, chat_id);

    expect(fetchRelevantTopics).toHaveBeenCalledWith(user_id, [0.1, 0.2, 0.3]);

    expect(consoleSpy).toHaveBeenCalledWith('No relevant topics found.');
    expect(checkNewTopicsInfo).not.toHaveBeenCalled();
    expect(TopicModel.findById).not.toHaveBeenCalled();
  });

  it('should update topics when new info is detected', async () => {
    const relevantTopics = [{ id: 'topic1', summary: 'Existing topic' }];
    const newInfoDetected = [
      { topic_id: 'topic1', topic_content: 'Updated topic content' },
    ];
    const existingTopic = {
      _id: 'topic1',
      summary: 'Existing topic',
      evidence: [],
      save: jest.fn(),
    };

    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (fetchRelevantTopics as jest.Mock).mockResolvedValue(relevantTopics);
    (checkNewTopicsInfo as jest.Mock).mockResolvedValue(newInfoDetected);
    (TopicModel.findById as jest.Mock).mockResolvedValue(existingTopic);
    (updateTopic as jest.Mock).mockResolvedValue({});

    await processTopics(user_id, msg, msg_idx, chat_id);

    expect(fetchRelevantTopics).toHaveBeenCalledWith(user_id, [0.1, 0.2, 0.3]);

    expect(checkNewTopicsInfo).toHaveBeenCalledWith(msg.text, [
      { id: 'topic1', summary: 'Existing topic' },
    ]);

    expect(existingTopic.evidence).toEqual([
      { chat_id: 'chat123', message_indecies: [1] },
    ]);
    expect(existingTopic.save).toHaveBeenCalled();

    expect(updateTopic).toHaveBeenCalledWith('topic1', 'Updated topic content');
  });

  it('should handle errors gracefully', async () => {
    (generateEmbedding as jest.Mock).mockRejectedValue(
      new Error('Embedding failed'),
    );

    const consoleSpy = jest.spyOn(console, 'error');

    await processTopics(user_id, msg, msg_idx, chat_id);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error processing topics:',
      expect.any(Error),
    );
  });
});
