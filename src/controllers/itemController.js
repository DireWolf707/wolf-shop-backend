import { catchAsync } from "../utils"
import { prisma, razorpay } from "../configs"
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils"
import { genInvoice } from "../utils"

export const getItemList = catchAsync(async (req, res) => {
  const items = await prisma.item.findMany()

  res.json({ data: items })
})

export const getItemDetail = catchAsync(async (req, res) => {
  const { itemId } = req.params

  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { images: true, reviews: true },
  })

  res.json({ data: item })
})

export const getOrders = catchAsync(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id, invoice: { not: null } },
    orderBy: { createdAt: "desc" },
  })

  res.json({ data: orders })
})

export const checkout = catchAsync(async (req, res) => {
  const { cart } = req.body

  const itemIds = cart.map((item) => item.id)
  const items = await prisma.item.findMany({ where: { id: { in: itemIds } } })

  const orderItems = items.map(({ id, price, name }) => ({
    name,
    price,
    itemId: id,
    quantity: cart.find((item) => item.id === id).qty,
  }))

  const amount = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0)
  const { id: razorpayOrderId } = await razorpay.orders.create({ amount: amount * 100, currency: "INR" })

  await prisma.order.create({
    data: {
      razorpayOrderId,
      amount,
      userId: req.user.id,
      orderItems: { createMany: { data: orderItems } },
    },
  })

  res.json({ data: { orderId: razorpayOrderId } })
})

export const orderWebhook = catchAsync(async (req, res) => {
  const isValid = validateWebhookSignature(JSON.stringify(req.body), req.headers["x-razorpay-signature"], process.env.SECRET)
  if (!isValid) return res.status(403).end()

  const { id: razorpayOrderId } = req.body.payload.order.entity
  const { id: razorpayPaymentId } = req.body.payload.payment.entity

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
    include: { orderItems: true, user: true },
  })

  const products = order.orderItems.map(({ name: description, price, quantity }) => ({ description, price, quantity, "tax-rate": 0 }))
  const invoiceURL = await genInvoice({ products, razorpayOrderId, razorpayPaymentId, user: order.user })

  await prisma.order.update({
    where: { razorpayOrderId },
    data: { razorpayPaymentId, invoice: invoiceURL },
    include: { orderItems: true, user: true },
  })

  res.end()
})
