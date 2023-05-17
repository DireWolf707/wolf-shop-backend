import { catchAsync } from "../utils"
import { prisma, razorpay } from "../configs"

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
  let userReview = null
  if (req.user) userReview = await prisma.review.findUnique({ where: { userId_itemId: { userId: req.user.id, itemId } } })
  const reviewsMetadata = await prisma.review.aggregate({
    where: { itemId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const relatedItems = await prisma.item.findMany({
    where: { id: { not: { equals: itemId }, category: item.category } },
  })

  res.json({ data: { ...item, relatedItems, reviewsMetadata, userReview } })
})

export const checkout = catchAsync(async (req, res) => {
  const { items } = req.body

  const itemIds = items.map((item) => item.id)
  const _items = await prisma.item.findMany({ where: { id: { in: itemIds } } })

  const orderItems = items.map(({ id, qty }) => ({
    itemId: id,
    quantity: qty,
    price: _items.find((item) => item.id === id).price,
  }))

  const amount = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0) * 100
  const { id: razorpayOrderId } = await razorpay.orders.create({ amount, currency: "INR" })

  await prisma.order.create({
    data: {
      userId: req.user.id,
      razorpayOrderId,
      items: { createMany: { data: orderItems } },
    },
  })

  res.json({ data: { orderId: razorpayOrderId, customerId: req.user.customerId } })
})
