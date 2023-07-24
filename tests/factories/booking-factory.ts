import { Address, Booking, Enrollment, Room, Ticket, TicketStatus, TicketType } from '@prisma/client';
import faker from '@faker-js/faker';
import { prisma } from '@/config';

type CreateBookingParams = {
  roomId: number;
  userId: number;
};

export function createBooking({ roomId, userId }: CreateBookingParams) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

export function getBooking() {
  const booking: Booking & { Room: Room } = {
    id: 1,
    userId: 1,
    roomId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    Room: {
      id: 1,
      name: 'Room 1',
      capacity: 2,
      hotelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
  return booking;
}

export function getBookingByUserId() {
  const booking: Booking & { Room: Room } = {
    id: 1,
    userId: 2,
    roomId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    Room: {
      id: 1,
      name: 'Room 1',
      capacity: 2,
      hotelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
  return booking;
}

export function findTicketByEnrollmentId() {
  const expected: Ticket & { TicketType: TicketType } = {
    id: 1,
    ticketTypeId: 1,
    enrollmentId: 1,
    status: TicketStatus.PAID,
    createdAt: new Date(),
    updatedAt: new Date(),
    TicketType: {
      id: 1,
      name: 'Alice',
      price: 200,
      isRemote: false,
      includesHotel: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return expected;
}



export function findRoomById() {
  const expected: Room = {
    id: 1,
    name: 'Alice',
    capacity: 5,
    hotelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return expected;
}

export function enrollmentWithAddress() {
  const expected: Enrollment & { Address: Address[] } = {
    id: 1,
    name: 'Alice',
    cpf: '15748559722',
    birthday: new Date(),
    phone: '983809862',
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    Address: [
      {
        id: 1,
        cep: '12354678',
        street: faker.address.streetName(),
        city: faker.address.city(),
        state: faker.address.state(),
        number: '248',
        neighborhood: faker.address.streetName(),
        addressDetail: faker.address.streetName(),
        enrollmentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  return expected;
}

export function findBookingByRoomId() {
  const expected: (Booking & { Room: Room })[] = [
    {
      id: 1,
      userId: 1,
      roomId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      Room: {
        id: 1,
        name: 'Alice',
        capacity: 2,
        hotelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  return expected;
}

export function findBookingsWithZeroCapacityRooms() {
  const expected: (Booking & { Room: Room })[] = [
    {
      id: 1,
      userId: 1,
      roomId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      Room: {
        id: 1,
        name: 'Alice',
        capacity: 1,
        hotelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  return expected;
}

export function findRoomByIdWithZeroCapacity() {
  const expected: Room = {
    id: 1,
    name: 'Alice',
    capacity: 1,
    hotelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return expected;
}
