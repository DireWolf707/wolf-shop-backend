import { catchAsync } from "../utils"
import { prisma, razorpay, storage } from "../configs"
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

  const amount = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0) * 100
  const { id: razorpayOrderId } = await razorpay.orders.create({ amount, currency: "INR" })

  await prisma.order.create({
    data: {
      userId: req.user.id,
      razorpayOrderId,
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
  const user = order.user
  const invoice = genInvoice({ user, products })

  const filename = `invoices/${razorpayPaymentId}.pdf`
  const file = storage.file(filename)
  await file.save(Buffer.from(invoice, "base64"))
  await file.makePublic()

  await prisma.order.update({
    where: { razorpayOrderId },
    data: { razorpayPaymentId, invoice: file.publicUrl() },
    include: { orderItems: true, user: true },
  })

  res.end()
})
