import faker from '@faker-js/faker';
import { createUser } from '../factories';
import { cleanDb } from '../helpers';
import { init } from '@/app';
import { prisma } from '@/config';
import authenticationService, { invalidCredentialsError } from '@/services/authentication-service';

beforeAll(async () => {
  await init();
  await cleanDb();
});

describe('signIn', () => {
  const generateParams = () => ({
    email: faker.internet.email(),
    password: faker.internet.password(6),
  });

  it('should throw InvalidCredentialError if there is no user for the given email', async () => {
    const params = generateParams();
    await expect(authenticationService.signIn(params)).rejects.toEqual(invalidCredentialsError());
  });

  it('should throw InvalidCredentialError if the given password is invalid', async () => {
    const params = generateParams();
    await createUser({
      email: params.email,
      password: 'invalid-password',
    });

    await expect(authenticationService.signIn(params)).rejects.toEqual(invalidCredentialsError());
  });

  describe('when email and password are valid', () => {
    it('should return user data and create a new session with a valid token', async () => {
      const params = generateParams();
      const user = await createUser(params);

      const { user: signInUser, token: createdSessionToken } = await authenticationService.signIn(params);

      expect(signInUser).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      );

      expect(createdSessionToken).toBeDefined();
      const session = await prisma.session.findFirst({
        where: {
          token: createdSessionToken,
          userId: user.id,
        },
      });
      expect(session).toBeDefined();
    });
  });
});
