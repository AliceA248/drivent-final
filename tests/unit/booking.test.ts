import {
  enrollmentWithAddress,
  findBookingsWithZeroCapacityRooms,
  findBookingByRoomId,
  findRoomByIdWithZeroCapacity,
  findRoomById,
  findTicketByEnrollmentId,
  getBookingByUserId,
  getBooking,
} from '../factories';

import bookingService from '../../src/services/booking-service';
import bookingRepository from '@/repositories/booking-repository';
import { notFoundError, cannotBookingError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import roomRepository from '@/repositories/room-repository';
import ticketsRepository from '@/repositories/tickets-repository';

describe('bookingService', () => {
  const userId = 1;
  const roomId = 1;
  const booking = getBooking();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBooking', () => {
    it('return the booking for the provided userId', async () => {
      jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValue(booking);

      const result = await bookingService.getBooking(userId);

      expect(bookingRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(booking);
    });

    it('throw notFoundError when the booking for the provided userId is not found', async () => {
      jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValue(null);

      await expect(bookingService.getBooking(userId)).rejects.toEqual(notFoundError());
      expect(bookingRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('bookingRoomById', () => {
    beforeEach(() => {
      jest.spyOn(bookingService, 'checkEnrollmentTicket').mockResolvedValue(undefined);
      jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValue(enrollmentWithAddress());
      jest.spyOn(ticketsRepository, 'findTicketByEnrollmentId').mockResolvedValue(findTicketByEnrollmentId());
      jest.spyOn(bookingService, 'checkValidBooking').mockResolvedValue(undefined);
      jest.spyOn(roomRepository, 'findById').mockResolvedValue(findRoomById());
      jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValue(findBookingByRoomId());
    });

    it('create a booking for the provided user and room', async () => {
      jest.spyOn(bookingRepository, 'create').mockResolvedValue(booking);

      const result = await bookingService.bookingRoomById(userId, roomId);

      expect(bookingRepository.create).toHaveBeenCalledWith({ userId, roomId });
      expect(result).toEqual(booking);
    });

    it('throw cannotBookingError if the user does not have a valid enrollment or ticket', async () => {
      jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValue(null);

      await expect(bookingService.bookingRoomById(userId, roomId)).rejects.toEqual(cannotBookingError());
    });
  });

  describe('changeBookingRoomById', () => {
    beforeEach(() => {
      jest.spyOn(bookingService, 'checkValidBooking').mockResolvedValue(undefined);
      jest.spyOn(roomRepository, 'findById').mockResolvedValue(findRoomById());
      jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValue(findBookingByRoomId());
    });

    it('change booking room by id', async () => {
      jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValue(booking);
      jest.spyOn(bookingRepository, 'upsertBooking').mockResolvedValue(booking);

      const result = await bookingService.changeBookingRoomById(userId, roomId);
      expect(result).toEqual(booking);
    });

    it('throw cannotBookingError when the booking is not found for the provided userId', async () => {
      jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValue(null);

      await expect(bookingService.changeBookingRoomById(userId, roomId)).rejects.toEqual(cannotBookingError());
    });

    it('throw cannotBookingError if the user id is different from the booking userId', async () => {
      const bookingByUserId = getBookingByUserId();
      jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValue(bookingByUserId);

      await expect(bookingService.changeBookingRoomById(userId, roomId)).rejects.toEqual(cannotBookingError());
    });
  });

  describe('checkEnrollmentTicket', () => {
    it('throw cannotBookingError when finding enrollment', async () => {
      jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValue(null);

      await expect(bookingService.bookingRoomById(userId, roomId)).rejects.toEqual(cannotBookingError());
      expect(enrollmentRepository.findWithAddressByUserId).toHaveBeenCalledWith(userId);
    });

    it('throw cannotBookingError when finding ticket', async () => {
      jest.spyOn(enrollmentRepository, 'findWithAddressByUserId').mockResolvedValue(enrollmentWithAddress());
      jest.spyOn(ticketsRepository, 'findTicketByEnrollmentId').mockResolvedValue(null);

      await expect(bookingService.bookingRoomById(userId, roomId)).rejects.toEqual(cannotBookingError());
      expect(ticketsRepository.findTicketByEnrollmentId).toHaveBeenCalledWith(userId);
    });
  });

  describe('checkValidBooking', () => {
    it('throw notFoundError when finding room by id', async () => {
      jest.spyOn(roomRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValue(findBookingByRoomId());

      await expect(bookingService.checkValidBooking(roomId)).rejects.toEqual(notFoundError());
    });

    it('throw cannotBookingError when finding booking by RoomId', async () => {
      jest.spyOn(roomRepository, 'findById').mockResolvedValue(findRoomByIdWithZeroCapacity());
      jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValue(findBookingsWithZeroCapacityRooms());

      await expect(bookingService.checkValidBooking(roomId)).rejects.toEqual(cannotBookingError());
    });
  });
});
