import { catchAsync } from "../utils"
import { prisma } from "../configs"

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
