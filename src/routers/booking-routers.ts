import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { bookingRoom, changeBooking, listBooking } from '@/controllers';

const bookingRouter = Router();

bookingRouter.use(authenticateToken);
bookingRouter.get('', listBooking);
bookingRouter.post('', bookingRoom);
bookingRouter.put('/:bookingId', changeBooking);

export { bookingRouter };
