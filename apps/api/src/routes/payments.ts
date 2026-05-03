import crypto from 'crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import Razorpay from 'razorpay';
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

type PlanType = keyof typeof amountMap;

function isPlan(value: unknown): value is PlanType {
  return value === 'monthly' || value === 'quarterly' || value === 'yearly';
}

function getRazorpay() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('razorpay_not_configured');
  }
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

function logRazorpayError(error: unknown) {
  const details = error as {
    message?: string;
    statusCode?: number;
    error?: {
      code?: string;
      description?: string;
      field?: string;
      reason?: string;
      source?: string;
      step?: string;
    };
  };

  console.error('Razorpay order creation failed', {
    message: details?.message,
    statusCode: details?.statusCode,
    razorpay: details?.error,
  });
}

async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = req.body?.plan;
    if (!isPlan(plan)) return res.status(400).json({ message: 'missing_fields' });
    const amount = amountMap[plan];
    if (amount < 100) return res.status(400).json({ message: 'invalid_amount' });
    const order = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${plan}_${Date.now()}`.slice(0, 39),
      notes: { plan, user_id: req.user!.id },
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, plan });
  } catch (error) {
    logRazorpayError(error);
    return res.status(500).json({ message: 'razorpay_order_failed' });
  }
}

async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body ?? {};
    const plan = body.plan;
    if (
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature ||
      !isPlan(plan)
    ) {
      return res.status(400).json({ message: 'missing_fields' });
    }

    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expected !== body.razorpay_signature) {
      return res.status(400).json({ message: 'invalid_signature' });
    }

    await query(
      `update users
       set plan = 'pro',
           plan_type = $1,
           plan_started_at = now(),
           plan_expires_at = now() + ($2 || ' days')::interval
       where id = $3`,
      [plan, daysMap[plan], req.user!.id],
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

paymentsRouter.post('/create-order', createOrder);
paymentsRouter.post('/verify', verifyPayment);
paymentsRouter.post('/verify-payment', verifyPayment);
