import httpStatus from 'http-status';
import supertest, { SuperTest, Test } from 'supertest';
import { createEvent } from '../factories';
import { cleanDb } from '../helpers';
import app, { init } from '@/app';

let server: SuperTest<Test>;

beforeAll(async () => {
  await init(); 
  await cleanDb(); 
  server = supertest(app); 
});

describe('GET /event', () => {
  it('respond with status 404 if there is no event', async () => {
    const response = await server.get('/event');
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('if there is an event, respond with status 200 and event datat', async () => {
    const event = await createEvent();

    const response = await server.get('/event');

    expect(response.status).toBe(httpStatus.OK);

    expect(response.body).toEqual({
      id: event.id,
      title: event.title,
      backgroundImageUrl: event.backgroundImageUrl,
      logoImageUrl: event.logoImageUrl,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
    });
  });
});
