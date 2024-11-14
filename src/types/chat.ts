export type Chat = {
  id: string;
  user_id: string;
  messages: Message[];
};

export type Message = {
  id: string;
  timestamp: Date;
  text: string;
  role: Role;
};

export type Chunk = {
  chat_id: string;
  message_indecies: number[];
};

export enum BotRole {
  e0 = 'e0',
  e1 = 'e1',
  p0 = 'p0',
  p1 = 'p1',
}

export type Role = BotRole | 'User';

export type ChatRequest = {
  query: string;
  user_id: string;
  chat_log?: Chat;
};

export type Transition = Map<BotRole, string>;

export type BotState = {
  currentRole: BotRole;
  transitions: Record<BotRole, Transition>;
};

export const botTransitions: Record<BotRole, Transition> = {
  [BotRole.p0]: new Map([
    [BotRole.p0, 'Stay in p0 until other function is triggered'], // p0:p0
    [
      BotRole.p1,
      'Move from p0 to p1 if the user changes volume by the relevant degree defined by database (TBD)',
    ], // p0:p1
    [
      BotRole.e0,
      'Move from p0 to e0 if the user asks questions unrelated to themselves or the model',
    ], // p0:e0
    [
      BotRole.e1,
      'Move from p0 to e1 if the model cannot identify the user’s meaning',
    ], // p0:e1
  ]),

  [BotRole.p1]: new Map([
    [
      BotRole.p1,
      'Stay in p1 when the user expresses multiple emotions that appear to conflict each other based on database (TBD)',
    ], // p1:p1
    [BotRole.p0, 'Move from p1 to p0 when the original p1 topic changes'], // p1:p0
    [
      BotRole.e0,
      'Move from p1 to e0 when the user does/cannot identify their current emotional state',
    ], // p1:e0
    [
      BotRole.e1,
      'Move from p1 to e1 when the user expresses self-doubt about their values or behavior after cross-analysis of database (TBD)',
    ], // p1:e1
  ]),

  [BotRole.e0]: new Map([
    [BotRole.e0, 'Stay in e0 unless another function is triggered'], // e0:e0
    [
      BotRole.e1,
      'Move from e0 to e1 when the user asks a question about their emotions',
    ], // e0:e1
    [
      BotRole.p0,
      'Move from e0 to p0 when the user makes a definitive bool statement',
    ], // e0:p0
    [
      BotRole.p1,
      'Move from e0 to p1 if the user challenges the model’s feedback',
    ], // e0:p1
  ]),

  [BotRole.e1]: new Map([
    [BotRole.e1, 'Remain in e1 unless another function is triggered'], // e1:e1
    [BotRole.e0, 'Move from e1 to e0 when the user asks for advice'], // e1:e0
    [
      BotRole.p0,
      'Move from e1 to p0 when the model is unclear about the user’s intended conversational direction',
    ], // e1:p0
    [
      BotRole.p1,
      'Move from e1 to p1 if the model has not identified the user’s objective',
    ], // e1:p1
  ]),
};
