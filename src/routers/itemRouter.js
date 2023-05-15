import express from "express"
import { getItemList, getItemDetail } from "../controllers/itemController"

const router = express.Router()
router.get("/", getItemList)
router.get("/:itemId", getItemDetail)

export default router
