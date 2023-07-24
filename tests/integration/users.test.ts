import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { createEvent, createUser } from '../factories';
import { cleanDb } from '../helpers';
import { duplicatedEmailError } from '@/services/users-service';
import { prisma } from '@/config';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe('POST /users', () => {
  const generateValidBody = () => ({
    email: faker.internet.email(),
    password: faker.internet.password(6),
  });

  it('respond with status 400 when body its not found', async () => {
    const response = await server.post('/users');
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  it('respond with status 400 when body is not valid', async () => {
    const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
    const response = await server.post('/users').send(invalidBody);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  describe('when body is valid', () => {
    let event: any;

    beforeAll(async () => {
      event = await createEvent();
    });

    it('respond with status 400 when current event still doesnt exists', async () => {
      const futureEvent = await createEvent({ startsAt: dayjs().add(1, 'day').toDate() });
      const body = generateValidBody();
      const response = await server.post('/users').send(body).query({ eventId: futureEvent.id });
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    describe('when event has started', () => {
      it('respond with status 409 when there is an existing user and email', async () => {
        const body = generateValidBody();
        await createUser(body);
        const response = await server.post('/users').send(body);
        expect(response.status).toBe(httpStatus.CONFLICT);
        expect(response.body).toEqual(duplicatedEmailError());
      });

      it('respond with status 201 and create user when email is unique', async () => {
        const body = generateValidBody();
        const response = await server.post('/users').send(body).query({ eventId: event.id });
        expect(response.status).toBe(httpStatus.CREATED);
        expect(response.body).toEqual({
          id: expect.any(Number),
          email: body.email,
        });
      });

      it('not return user password', async () => {
        const body = generateValidBody();
        const response = await server.post('/users').send(body).query({ eventId: event.id });
        expect(response.body).not.toHaveProperty('password');
      });

      it('save user', async () => {
        const body = generateValidBody();
        const response = await server.post('/users').send(body).query({ eventId: event.id });
        const user = await prisma.user.findUnique({
          where: { email: body.email },
        });
        expect(user).toEqual(
          expect.objectContaining({
            id: response.body.id,
            email: body.email,
          }),
        );
      });
    });
  });
});
