import faker from '@faker-js/faker';
import supertest, { SuperTest, Test } from 'supertest';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import { generateCPF, getStates } from '@brazilian-utils/brazilian-utils';
import dayjs from 'dayjs';

import app, { init } from '@/app';
import { createUser, createEnrollmentWithAddress, createhAddressWithCEP } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';

let server: SuperTest<Test>;

beforeAll(async () => {
  await init();
  await cleanDb();
  server = supertest(app);
});

describe('GET /enrollments', () => {
  it("respond status 401 if no token its given", async () => {
    const response = await server.get('/enrollments');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond status 401 if given token its not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/enrollments').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond status 401 if there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/enrollments').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 204 when there is no enrollment for the user', async () => {
      const token = await generateValidToken();
      const response = await server.get('/enrollments').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NO_CONTENT);
    });

    it('respond with status 200 and enrollment data with address when there is an enrollment for the user', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const response = await server.get('/enrollments').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: enrollment.id,
        name: enrollment.name,
        cpf: enrollment.cpf,
        birthday: enrollment.birthday.toISOString(),
        phone: enrollment.phone,
        address: {
          id: enrollment.Address[0].id,
          cep: enrollment.Address[0].cep,
          street: enrollment.Address[0].street,
          city: enrollment.Address[0].city,
          state: enrollment.Address[0].state,
          number: enrollment.Address[0].number,
          neighborhood: enrollment.Address[0].neighborhood,
          addressDetail: enrollment.Address[0].addressDetail,
        },
      });
    });
  });
});

describe('GET /enrollments/cep', () => {
  it('respond with status 200 when CEP is valid', async () => {
    const response = await server.get('/enrollments/cep?cep=04538132');
    const address = createhAddressWithCEP();
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(address);
  });

  it('respond with status 204 when CEP is invalid', async () => {
    const response = await server.get('/enrollments/cep?cep=00');
    expect(response.status).toBe(httpStatus.NO_CONTENT);
  });
});

describe('POST /enrollments', () => {
  it('respond with status 401 when no token is given', async () => {
    const response = await server.post('/enrollments');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when the token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when is no session for the token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 400 when body is not found', async () => {
      const token = await generateValidToken();
      const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('respond with status 400 when body is not valid', async () => {
      const token = await generateValidToken();
      const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
      const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`).send(invalidBody);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    describe('when body is valid', () => {
      it('respond with status 201 and create a new enrollment', async () => {
        const validBody = generateValidEnrollmentBody();
        const token = await generateValidToken();
        const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`).send(validBody);
        expect(response.status).toBe(httpStatus.OK);
        const enrollment = await prisma.enrollment.findFirst({ where: { cpf: validBody.cpf } });
        expect(enrollment).toBeDefined();
      });

      it('respond with status 200 and update enrollment if exists', async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const validBody = generateValidEnrollmentBody();
        const token = await generateValidToken(user);
        const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`).send(validBody);
        expect(response.status).toBe(httpStatus.OK);
        const updatedEnrollment = await prisma.enrollment.findUnique({ where: { userId: user.id } });
        const addresses = await prisma.address.findMany({ where: { enrollmentId: enrollment.id } });
        expect(addresses.length).toEqual(1);
        expect(updatedEnrollment).toBeDefined();
        expect(updatedEnrollment).toEqual(
          expect.objectContaining({
            name: validBody.name,
            cpf: validBody.cpf,
            birthday: dayjs(validBody.birthday).toDate(),
            phone: validBody.phone,
          }),
        );
      });
    });

    describe('when body is invalid', () => {
      it('respond with status 400 and create a new enrollment', async () => {
        const invalidBody = generateInvalidEnrollmentBody();
        const token = await generateValidToken();
        const response = await server.post('/enrollments').set('Authorization', `Bearer ${token}`).send(invalidBody);
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
    });
  });
});


const generateValidEnrollmentBody = () => {
  return {
    name: faker.name.findName(),
    cpf: generateCPF(),
    birthday: faker.date.past().toISOString(),
    phone: '(21) 98999-9999',
    address: {
      logradouro: 'Avenida Brigadeiro Faria Lima',
      complemento: 'de 3252 ao fim - lado par',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      uf: 'SP',
    },
  };
};




const generateInvalidEnrollmentBody = () => {
  return {
    name: faker.name.findName(),
    cpf: generateCPF(),
    birthday: faker.date.past().toISOString(),
    phone: '(21) 98999-9999',
    address: {
      cep: '0',
      street: faker.address.streetName(),
      city: faker.address.city(),
      number: faker.datatype.number().toString(),
      state: faker.helpers.arrayElement(getStates()).code,
      neighborhood: faker.address.secondaryAddress(),
      addressDetail: faker.lorem.sentence(),
    },
  };
};
