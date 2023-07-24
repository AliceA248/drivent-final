import supertest from 'supertest';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import app, { init } from '@/app';
import { createUser, createEnrollmentWithAddress, createTicket, createPayment, createTicketHotelType, createHotel, createRoomWithHotelId, createBooking } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';

const server = supertest(app);

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const setupBookingScenario = async () => {
  const user = await createUser();
  const token = await generateValidToken(user);
  const enrollment = await createEnrollmentWithAddress(user);
  const ticketType = await createTicketHotelType();
  const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
  await createPayment(ticket.id, ticketType.price);
  const hotel = await createHotel();
  const room = await createRoomWithHotelId(hotel.id);
  return { user, token, room, hotel };
};

describe('GET /booking', () => {
  it('respond with status 401 when no token is provide', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when provide token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for provide token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 404 when user has not a booking', async () => {
      const { token } = await setupBookingScenario();

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('respond with status 200 when user has a booking', async () => {
      const { user, token, room } = await setupBookingScenario();
      const booking = await createBooking({
        userId: user.id,
        roomId: room.id,
      });

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: expect.any(Number),
          name: expect.any(String),
          capacity: expect.any(Number),
          hotelId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });
  });
});

function createValidBody() {
  return {
    roomId: 1,
  };
}

describe('POST /booking', () => {
  it('respond with status 401 when no token is provide', async () => {
    const validBody = createValidBody();
    const response = await server.post('/booking').send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when provide token is not valid', async () => {
    const token = faker.lorem.word();
    const validBody = createValidBody();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for provide token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const validBody = createValidBody();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 200 with a valid body', async () => {
      const { token, room } = await setupBookingScenario();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: room.id,
      });

      expect(response.status).toEqual(httpStatus.OK);
    });

    it('respond with status 400 with a invalid body', async () => {
      const { token } = await setupBookingScenario();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: 0,
      });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("respond with status 404 with a invalid body - there's not roomId", async () => {
      const { token, room } = await setupBookingScenario();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: room.id + 1,
      });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("respond with status 403 with a invalid body - there's not vacancy", async () => {
      const { token, room } = await setupBookingScenario();
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: room.id,
      });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('respond with status 403 when user has not enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createTicketHotelType();

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: room.id,
      });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('respond with status 403 when user has not paymented ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({
        roomId: room.id,
      });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  });
});

describe('PUT /booking', () => {
  it('respond with status 401 when no token is provide', async () => {
    const validBody = createValidBody();
    const response = await server.put('/booking/1').send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when provide token is not valid', async () => {
    const token = faker.lorem.word();
    const validBody = createValidBody();
    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for provide token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const validBody = createValidBody();
    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 200 with a valid body', async () => {
      const { user, token, room, hotel } = await setupBookingScenario();
      const booking = await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const otherRoom = await createRoomWithHotelId(hotel.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({
        roomId: otherRoom.id,
      });

      expect(response.status).toEqual(httpStatus.OK);
    });

    it('respond with status 400 with invalid bookingId', async () => {
      const { user, token, room } = await setupBookingScenario();
      await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const otherRoom = await createRoomWithHotelId(room.id);

      const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`).send({
        roomId: otherRoom.id,
      });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it('respond with status 400 with a invalid body', async () => {
      const { user, token, room } = await setupBookingScenario();
      const booking = await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({
        roomId: 0,
      });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("respond with status 404 with a invalid body - there's no roomId", async () => {
      const { user, token, room } = await setupBookingScenario();
      const booking = await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId: room.id + 1,
        });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("respond with status 403 with a invalid body - there's not vacancy", async () => {
      const { token, room } = await setupBookingScenario();
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });
      await createBooking({
        userId: room.id,
        roomId: room.id,
      });

      const response = await server.put(`/booking/${room.id}`).set('Authorization', `Bearer ${token}`).send({
        roomId: room.id,
      });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('respond with status 404 when user has not a booking', async () => {
      const { token, room } = await setupBookingScenario();
      const otherUser = await createUser();
      const otherUserBooking = await createBooking({
        userId: otherUser.id,
        roomId: room.id,
      });

      const response = await server
        .put(`/booking/${otherUserBooking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId: room.id,
        });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  });
});


describe('DELETE /booking', () => {
  it('respond with status 401 when no token is provide', async () => {
    const response = await server.delete('/booking/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when provide token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.delete('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('respond with status 401 when there is no session for provide token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.delete('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('respond with status 200 when user cancels their booking', async () => {
      const { user, token, room } = await setupBookingScenario();
      const booking = await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const response = await server.delete(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
    });

    it('respond with status 400 with invalid bookingId', async () => {
      const { token } = await setupBookingScenario();

      const response = await server.delete('/booking/0').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("respond with status 403 when user tries to cancel someone else's booking", async () => {
      const { token, room } = await setupBookingScenario();
      const otherUser = await createUser();
      const otherUserBooking = await createBooking({
        userId: otherUser.id,
        roomId: room.id,
      });

      const response = await server.delete(`/booking/${otherUserBooking.id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  });
});



