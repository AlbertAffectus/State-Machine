import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import { Server } from 'http';

let server: Server;

describe('POST /chat', () => {
  beforeAll((done) => {
    server = app.listen(3001, done);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  it('should return 200 and update the chat log', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        query: 'Hello!',
        user_id: '123123123',
        chat_log: {
          id: '001',
          messages: [
            {
              id: '001',
              timestamp: new Date(),
              text: 'Hello!',
              role: 'User',
            },
          ],
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Chat log updated successfully');
  });
});
