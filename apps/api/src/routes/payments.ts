import crypto from 'crypto';
import { Router } from 'express';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

const amountMap = {
  monthly: 4900,
  quarterly: 9900,
  yearly: 29900,
} as const;

const daysMap = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
} as const;

function getRazorpay() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('razorpay_not_configured');
  }
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

paymentsRouter.post('/create-order', async (req, res, next) => {
  try {
    const { plan } = z
      .object({ plan: z.enum(['monthly', 'quarterly', 'yearly']) })
      .parse(req.body);
    const order = await getRazorpay().orders.create({
      amount: amountMap[plan],
      currency: 'INR',
      receipt: `jt_${Date.now()}`,
      notes: { plan, user_id: req.user!.id },
    });
    res.json({ order_id: order.id, amount: order.amount, plan });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post('/verify', async (req, res, next) => {
  try {
    const body = z
      .object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
        plan: z.enum(['monthly', 'quarterly', 'yearly']),
      })
      .parse(req.body);

    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expected !== body.razorpay_signature) {
      return res.status(400).json({ message: 'invalid_signature' });
    }

    await query(
      `update users
       set plan = 'pro', plan_expires_at = now() + ($1 || ' days')::interval
       where id = $2`,
      [daysMap[body.plan], req.user!.id],
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});
