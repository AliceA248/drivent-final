import { generateCPF, getStates } from '@brazilian-utils/brazilian-utils';
import { faker } from '@faker-js/faker';
import { createEnrollmentSchema } from '@/schemas';

describe('createEnrollmentSchema', () => {
  const generateValidInput = () => ({
    name: faker.name.findName(),
    cpf: generateCPF(),
    birthday: faker.date.past().toISOString(),
    phone: '(21) 98999-9999',
    address: {
      cep: '90830-563',
      street: faker.address.streetName(),
      city: faker.address.city(),
      number: faker.datatype.number().toString(),
      state: faker.helpers.arrayElement(getStates()).code,
      neighborhood: faker.address.secondaryAddress(),
      addressDetail: faker.lorem.sentence(),
    },
  });

  it('return an error when input doesnt exists', () => {
    const result = createEnrollmentSchema.validate(null);

    expect(result.error).toBeDefined();
  });

  describe('name', () => {
    it('return error when name is not provided', () => {
      const input = generateValidInput();
      delete input.name;

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error when name is less than 3 characters', () => {
      const input = generateValidInput();
      input.name = faker.lorem.word(2);

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });
  });

  describe('cpf', () => {
    it('return error when cpf is not provided', () => {
      const input = generateValidInput();
      delete input.cpf;

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error when cpf its not valid', () => {
      const input = generateValidInput();
      input.cpf = '12345678901';

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error when cpf is masked', () => {
      const input = generateValidInput();
      input.cpf = '012.345.678-90';

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });
  });

  describe('birthday', () => {
    it('return error when birthday its provided', () => {
      const input = generateValidInput();
      delete input.birthday;

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

  });

  describe('phone', () => {
    it('return error when phone its provided', () => {
      const input = generateValidInput();
      delete input.phone;

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error when phone is not a mobile phone', () => {
      const input = generateValidInput();
      input.phone = '1234567890';

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    it('return error when phone is not masked', () => {
      const input = generateValidInput();
      input.phone = '12999887766';

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });
  });

  describe('address', () => {
    it('return error when address is not provide', () => {
      const input = generateValidInput();
      delete input.address;

      const { error } = createEnrollmentSchema.validate(input);

      expect(error).toBeDefined();
    });

    describe('cep', () => {
      it('return error when cep its not provided', () => {
        const input = generateValidInput();
        delete input.address.cep;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when cep is not a cep', () => {
        const input = generateValidInput();
        input.address.cep = '1234567890';

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when cep is not masked', () => {
        const input = generateValidInput();
        input.address.cep = '12345678';

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });
    });

    describe('street', () => {
      it('return error when street is not provide', () => {
        const input = generateValidInput();
        delete input.address.street;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when street is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            street: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });

    describe('city', () => {
      it('return error when city is not provide', () => {
        const input = generateValidInput();
        delete input.address.city;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when city is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            city: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });

    describe('number', () => {
      it('return error when number is not provide', () => {
        const input = generateValidInput();
        delete input.address.number;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when number is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            number: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });

    describe('state', () => {
      it('return error when state is not provide', () => {
        const input = generateValidInput();
        delete input.address.state;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when state is not a valid brazilian state', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            state: 'XX',
          },
        });

        expect(error).toBeDefined();
      });

      it('return error when state is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            state: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });

    describe('neighborhood', () => {
      it('return error when neighborhood is not provide', () => {
        const input = generateValidInput();
        delete input.address.neighborhood;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeDefined();
      });

      it('return error when neighborhood is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            neighborhood: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });

    describe('addressDetail', () => {
      it('not return error when addressDetail is not provide', () => {
        const input = generateValidInput();
        delete input.address.addressDetail;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeUndefined();
      });

      it('return error when addressDetail is an empty string', () => {
        const input = generateValidInput();
        input.address.addressDetail = '';

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeUndefined();
      });

      it('return error when addressDetail is null', () => {
        const input = generateValidInput();
        input.address.addressDetail = null;

        const { error } = createEnrollmentSchema.validate(input);

        expect(error).toBeUndefined();
      });

      it('return error when addressDetail is not a string', () => {
        const input = generateValidInput();

        const { error } = createEnrollmentSchema.validate({
          ...input,
          address: {
            ...input.address,
            addressDetail: faker.datatype.number(),
          },
        });

        expect(error).toBeDefined();
      });
    });
  });

  it('return no error when schema is valid', () => {
    const input = generateValidInput();

    const { error } = createEnrollmentSchema.validate(input);

    expect(error).toBeUndefined();
  });
});
