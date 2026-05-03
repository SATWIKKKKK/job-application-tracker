import crypto from 'crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
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

const createOrderSchema = z
  .object({
    plan: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    amount: z.number().int().min(100).optional(),
    currency: z.string().min(3).max(3).optional(),
    receipt: z.string().min(1).max(40).optional(),
  })
  .refine((body) => body.plan || body.amount, { message: 'plan_or_amount_required' });

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});

function getRazorpay() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('razorpay_not_configured');
  }
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createOrderSchema.parse(req.body);
    const plan = body.plan;
    const amount = plan ? amountMap[plan] : body.amount!;
    const order = await getRazorpay().orders.create({
      amount,
      currency: body.currency ?? 'INR',
      receipt: body.receipt ?? `jt_${Date.now()}`,
      notes: { plan: plan ?? 'custom', user_id: req.user!.id },
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, plan });
  } catch (error) {
    next(error);
  }
}

async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = verifyPaymentSchema.parse(req.body);

    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expected !== body.razorpay_signature) {
      return res.status(400).json({ message: 'invalid_signature' });
    }

    if (body.plan) {
      await query(
        `update users
         set plan = 'pro', plan_expires_at = now() + ($1 || ' days')::interval
         where id = $2`,
        [daysMap[body.plan], req.user!.id],
      );
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

paymentsRouter.post('/create-order', createOrder);
paymentsRouter.post('/verify', verifyPayment);
paymentsRouter.post('/verify-payment', verifyPayment);
