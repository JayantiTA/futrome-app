import nextConnect from 'next-connect';

import auth from '../../../middleware/auth';
import connectToDatabase from '../../../lib/mongoose';
import Reservation from '../../../models/reservation';
import Payment from '../../../models/payment';

import { localValidationError, notFoundError, errorHandler } from '../../../helper/error';
import { decodeBase64Image, encodeBase64Image } from '../../../helper/image';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

const handler = nextConnect({
  onError: errorHandler,
  onNoMatch: (req, res) => {
    res.status(405).json({
      message: 'Method not allowed',
      success: false,
    });
  },
});

handler
  .use(auth())
  .post(async (req, res, next) => {
    await connectToDatabase();
    const reservation = await Reservation.findById(req.body._id);

    if (!reservation || reservation.buyer_id.toString() !== req.user._id.toString()) {
      return next({
        name: notFoundError,
        message: 'Reservation not found',
      });
    }

    if (reservation.status !== 'waiting for payment') {
      return next({
        name: localValidationError,
        message: 'Invalid Reservation status',
      });
    }

    const payment = await Payment.create({
      reservation_id: req.body._id,
      ...req.body.data,
      attachment: decodeBase64Image(req.body.data.attachment),
    });

    reservation.status = 'waiting for confirmation';
    reservation.paid_at = new Date();
    reservation.updated_at = new Date();
    await reservation.save();

    return res.json({
      message: 'Pay success',
      data: {
        reservation,
        payment: {
          ...payment._doc,
          attachment: encodeBase64Image(payment.attachment),
        },
      },
      success: true,
    });
  });

export default handler;
