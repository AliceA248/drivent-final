import httpStatus from 'http-status';
import supertest, { SuperTest, Test } from 'supertest';
import app, { init } from '@/app';
import { cleanDb, generateValidToken } from '../helpers';
import { createHotel, createRoomWithHotelId, createUser, createEnrollmentWithAddress, createTicket, createTicketHotelType, createTicketTypeRemote, createPayment } from '../factories';
import { TicketStatus } from '@prisma/client';
let server: SuperTest<Test>;

beforeAll(async () => {
  await init(); 
  server = supertest(app); 
});

beforeEach(async () => {
  await cleanDb(); 
});

describe('GET /hotels', () => {
  it('respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 if token is not valid', async () => {
    const token = 'invalid_token';
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 if there is no session token', async () => {
    const userWithoutSession = await createUser();
    const token = generateValidToken(userWithoutSession);
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 402 when user ticket is remote', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const token = generateValidToken(user);

      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it('respond with status 404 when user has no enrollment', async () => {
      const user = await createUser();
      const token = generateValidToken(user);
      await createTicketTypeRemote();

      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('respond with status 200 and a list of hotels', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const token = generateValidToken(user);
      const createdHotel = await createHotel();

      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: createdHotel.id,
          name: createdHotel.name,
          image: createdHotel.image,
          createdAt: createdHotel.createdAt.toISOString(),
          updatedAt: createdHotel.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

