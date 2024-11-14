import { getTransitionRules, processBotState } from '../stateProcessor';
import { BotRole, Message } from '../types/chat';
import { getNextBotState } from '../chatGptAdapter';
import { Topic } from '../types/user';

jest.mock('../chatGptAdapter');

describe('processBotState', () => {
  const topics: Topic[] = [
    {
      id: 'topic1',
      summary: 'Bob likes to cook, especially seafood',
      evidence: [],
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      text: 'Tell me about my previous conversation',
      role: 'User',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'We discussed your preferences last time.',
      role: BotRole.e0,
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should transition to the next state based on the conversation', async () => {
    const transitionRules = new Map([
      [BotRole.e1, 'If user follows up on a previously discussed topic'],
    ]);

    jest
      .spyOn(require('../stateProcessor'), 'getTransitionRules')
      .mockReturnValue(transitionRules);

    (getNextBotState as jest.Mock).mockResolvedValue('p0');

    const nextState = await processBotState(messages, topics);

    expect(getTransitionRules).toHaveBeenCalledWith(BotRole.e0);
    expect(getNextBotState).toHaveBeenCalledWith(
      expect.any(String),
      transitionRules,
    );

    expect(nextState).toBe('p0');
  });
});
