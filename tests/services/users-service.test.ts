import faker from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { createUser as createUserSeed, createEvent as createEventSeed } from '../factories';
import { cleanDb } from '../helpers';
import userService, { duplicatedEmailError } from '@/services/users-service';
import { prisma } from '@/config';
import { init } from '@/app';

beforeEach(async () => {
  await init();
  await cleanDb();
});

describe('createUser', () => {
  it('throw duplicatedUserError if there is a user with the email provided', async () => {
    const existingUser = await createUserSeed();
    await createEventSeed();

    try {
      await userService.createUser({
        email: existingUser.email,
        password: faker.internet.password(6),
      });
      fail('throw duplicatedUserError');
    } catch (error) {
      expect(error).toEqual(duplicatedEmailError());
    }
  });

  it('create user when the given email is unique', async () => {
    const user = await userService.createUser({
      email: faker.internet.email(),
      password: faker.internet.password(6),
    });

    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    expect(user).toEqual(
      expect.objectContaining({
        id: dbUser.id,
        email: dbUser.email,
      }),
    );
  });

  it('hash user password', async () => {
    const rawPassword = faker.internet.password(6);
    const user = await userService.createUser({
      email: faker.internet.email(),
      password: rawPassword,
    });

    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    expect(dbUser.password).not.toBe(rawPassword);
    expect(await bcrypt.compare(rawPassword, dbUser.password)).toBe(true);
  });
});
