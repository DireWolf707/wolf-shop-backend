import express from "express"
import { getItemList, getItemDetail, checkout, orderWebhook, getOrders } from "../controllers/itemController"
import { isAuthenticated } from "../middlewares/auth"

const router = express.Router()
router.get("/", getItemList)
router.get("/orders", isAuthenticated, getOrders)
router.post("/checkout", isAuthenticated, checkout)
router.post("/order-webhook", orderWebhook)
router.route("/:itemId").get(getItemDetail)

export default router
