import faker from '@faker-js/faker';
import { createUserSchema } from '@/schemas';

describe('createUserSchema', () => {
  const generateValidInput = () => ({
    email: faker.internet.email(),
    password: faker.internet.password(6),
  });

  describe('when email is not valid', () => {
    it('return error if email is not provide', () => {
      const input = generateValidInput();
      delete input.email;

      const { error } = createUserSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error if email is not on a valid  format', () => {
      const input = generateValidInput();
      input.email = faker.lorem.word();

      const { error } = createUserSchema.validate(input);

      expect(error).toBeDefined();
    });
  });

  describe('when password is not valid', () => {
    it('return error if password is not provide', () => {
      const input = generateValidInput();
      delete input.password;

      const { error } = createUserSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error if password is less than 6 characters', () => {
      const input = generateValidInput();
      input.password = faker.lorem.word(5);

      const { error } = createUserSchema.validate(input);

      expect(error).toBeDefined();
    });
  });

  it('return no error if input is valid!', () => {
    const input = generateValidInput();

    const { error } = createUserSchema.validate(input);

    expect(error).toBeUndefined();
  });
});
