import supertest from 'supertest';
import httpStatus from 'http-status';
import app, { init } from '@/app';
import { createUser } from '../factories';
import { cleanDb } from '../helpers';
import faker from '@faker-js/faker';

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe('POST /auth/sign-in', () => {
  it('respond with status 400 when body is not provid', async () => {
    const response = await server.post('/auth/sign-in');

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  it('respond with status 400 when body its not valid', async () => {
    const response = await server.post('/auth/sign-in').send({ invalidField: 'value' });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  describe('when body is valid', () => {
    const generateValidBody = () => ({
      email: faker.internet.email(),
      password: faker.internet.password(6),
    });

    it('respond with status 401 when there is no user for the provid email', async () => {
      const body = generateValidBody();

      const response = await server.post('/auth/sign-in').send(body);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('respond with status 401 when there is a user for provid email but the password doesnt match', async () => {
      const body = generateValidBody();
      await createUser(body);

      const response = await server.post('/auth/sign-in').send({
        ...body,
        password: faker.internet.password(6),
      });

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when credentials are valid', () => {
      it('respond with status 200', async () => {
        const body = generateValidBody();
        await createUser(body);

        const response = await server.post('/auth/sign-in').send(body);

        expect(response.status).toBe(httpStatus.OK);
      });

      it('respond with user data', async () => {
        const body = generateValidBody();
        const user = await createUser(body);

        const response = await server.post('/auth/sign-in').send(body);

        expect(response.body.user).toEqual({
          id: user.id,
          email: user.email,
        });
      });

      it('respond with session token', async () => {
        const body = generateValidBody();
        await createUser(body);

        const response = await server.post('/auth/sign-in').send(body);

        expect(response.body.token).toBeDefined();
      });
    });
  });
});
