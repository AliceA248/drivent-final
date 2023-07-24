import httpStatus from 'http-status';
import supertest from 'supertest';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

const server = supertest(app);

describe('GET /health', () => {
  it('respond with status 200', async () => {
    const response = await server.get('/health');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.text).toBe('OK!');
  });
});
