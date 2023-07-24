import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createEnrollmentWithAddress, createUser, createTicketType, createTicket } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /tickets/types', () => {
  const validToken = async () => generateValidToken();

  it('respond with status 401 if user is not authenticated', async () => {
    const response = await server.get('/tickets/types');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when a invalid token is given', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/tickets/types').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for the token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/tickets/types').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when user is authenticated', () => {
    it('respond with an empty array when there are no tickets types created', async () => {
      const token = await validToken();
      const response = await server.get('/tickets/types').set('Authorization', `Bearer ${token}`);
      expect(response.body).toEqual([]);
    });

    it('respond with status 200 and existing TicketTypes', async () => {
      const token = await validToken();
      const ticketType = await createTicketType();
      const response = await server.get('/tickets/types').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          isRemote: ticketType.isRemote,
          includesHotel: ticketType.includesHotel,
          createdAt: ticketType.createdAt.toISOString(),
          updatedAt: ticketType.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

describe('GET /tickets', () => {
  const validToken = async () => generateValidToken();

  it('respond with status 401 when the user is not authenticated', async () => {
    const response = await server.get('/tickets');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when a invalid token is given', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/tickets').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for the token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/tickets').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when user is authenticated', () => {
    let token: string;
    let ticketType: any;
    let enrollmentId: number;
    let ticketId: number;

    beforeEach(async () => {
      const user = await createUser();
      token = await validToken();
      const enrollment = await createEnrollmentWithAddress(user);
      enrollmentId = enrollment.id;
      ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      ticketId = ticket.id;
    });

    it('respond with status 200 and with ticket', async () => {
      const response = await server.get('/tickets').set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: ticketId,
        status: TicketStatus.RESERVED,
        ticketTypeId: ticketType.id,
        enrollmentId: enrollmentId,
        TicketType: {
          id: ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          isRemote: ticketType.isRemote,
          includesHotel: ticketType.includesHotel,
          createdAt: ticketType.createdAt.toISOString(),
          updatedAt: ticketType.updatedAt.toISOString(),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });
});

describe('POST /tickets', () => {
  const validToken = async () => generateValidToken();
  let token: string;
  let enrollmentId: number;
  let ticketType: any;

  beforeEach(async () => {
    const user = await createUser();
    token = await validToken();
    const enrollment = await createEnrollmentWithAddress(user);
    enrollmentId = enrollment.id;
    ticketType = await createTicketType();
  });

  it('respond with status 401 when user is not authenticated', async () => {
    const response = await server.post('/tickets');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when a invalid token is given', async () => {
    const token = faker.lorem.word();
    const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for the token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when user is authenticated', () => {
    it('respond with status 400 when ticketTypeId is not present in body', async () => {
      const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({});
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it('respond with status 404 when user doesnt have enrollment', async () => {
      await prisma.enrollment.deleteMany(); // Delete all enrollments to simulate user without enrollment
      const response = await server
        .post('/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticketTypeId: ticketType.id });
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('respond with status 201 and ticket data', async () => {
      const response = await server
        .post('/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticketTypeId: ticketType.id });
      expect(response.status).toEqual(httpStatus.CREATED);
      expect(response.body).toEqual({
        id: expect.any(Number),
        status: TicketStatus.RESERVED,
        ticketTypeId: ticketType.id,
        enrollmentId: enrollmentId,
        TicketType: {
          id: ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          isRemote: ticketType.isRemote,
          includesHotel: ticketType.includesHotel,
          createdAt: ticketType.createdAt.toISOString(),
          updatedAt: ticketType.updatedAt.toISOString(),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('insert a new ticket', async () => {
      const beforeCount = await prisma.ticket.count();
      await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({ ticketTypeId: ticketType.id });
      const afterCount = await prisma.ticket.count();
      expect(beforeCount).toEqual(0);
      expect(afterCount).toEqual(1);
    });
  });
});
