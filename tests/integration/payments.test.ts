import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  generateDataOfCreditCard,
} from '../factories';
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

const createValidToken = async (user?: any) => {
  const currentUser = user || await createUser();
  return generateValidToken(currentUser);
};

describe('GET /payments', () => {
  describe('When user is not authenticated', () => {
    it('respond with status 401', async () => {
      const response = await server.get('/payments');
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('When user is authenticated', () => {
    let token: string;
    let enrollmentId: number;
    let ticketType: any;
    let ticketId: number;

    beforeEach(async () => {
      const user = await createUser();
      token = await createValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      enrollmentId = enrollment.id;
      ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      ticketId = ticket.id;
    });

    it('respond with status 400 if query param ticketId is not found', async () => {
      const response = await server.get('/payments').set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it('respond with status 404 when given ticket doesnt exist', async () => {
      const response = await server.get('/payments?ticketId=1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('respond with status 401 when the user doesnt have a ticket', async () => {
      const otherUser = await createUser();
      const otherUserEnrollment = await createEnrollmentWithAddress(otherUser);
      const ticket = await createTicket(otherUserEnrollment.id, ticketType.id, TicketStatus.RESERVED);
      const response = await server.get(`/payments?ticketId=${ticket.id}`).set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it('respond with status 200 and with payment data', async () => {
      const payment = await createPayment(ticketId, ticketType.price);
      const response = await server.get(`/payments?ticketId=${ticketId}`).set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: payment.id,
        ticketId: ticketId,
        value: ticketType.price,
        cardIssuer: payment.cardIssuer,
        cardLastDigits: payment.cardLastDigits,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });
});

describe('POST /payments/process', () => {
  describe('When user is not authenticated', () => {
    it('respond with status 401', async () => {
      const response = await server.post('/payments/process');
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('When user is authenticated', () => {
    let token: string;
    let enrollmentId: number;
    let ticketType: any;
    let ticketId: number;

    beforeEach(async () => {
      const user = await createUser();
      token = await createValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      enrollmentId = enrollment.id;
      ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      ticketId = ticket.id;
    });

    it('respond with status 400 if body param ticketId is missing', async () => {
      const body = { cardData: generateDataOfCreditCard() };
      const response = await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it('respond with status 400 if body param cardData is missing', async () => {
      const body = { ticketId: ticketId };
      const response = await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it('respond with status 404 when given ticket doesnt exist', async () => {
      const body = { ticketId: 1, cardData: generateDataOfCreditCard() };
      const response = await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('respond with status 401 when user doesnt have given ticket', async () => {
      const otherUser = await createUser();
      const otherUserEnrollment = await createEnrollmentWithAddress(otherUser);
      const ticket = await createTicket(otherUserEnrollment.id, ticketType.id, TicketStatus.RESERVED);
      const body = { ticketId: ticket.id, cardData: generateDataOfCreditCard() };
      const response = await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it('respond with status 200 and with payment data', async () => {
      const body = { ticketId: ticketId, cardData: generateDataOfCreditCard() };
      const response = await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ticketId: ticketId,
        value: ticketType.price,
        cardIssuer: body.cardData.issuer,
        cardLastDigits: body.cardData.number.slice(-4),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('insert a new payment', async () => {
      const beforeCount = await prisma.payment.count();
      const body = { ticketId: ticketId, cardData: generateDataOfCreditCard() };
      await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      const afterCount = await prisma.payment.count();
      expect(beforeCount).toEqual(0);
      expect(afterCount).toEqual(1);
    });

    it('change ticket status to PAID', async () => {
      const body = { ticketId: ticketId, cardData: generateDataOfCreditCard() };
      await server.post('/payments/process').set('Authorization', `Bearer ${token}`).send(body);
      const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      expect(updatedTicket.status).toEqual(TicketStatus.PAID);
    });
  });
});
