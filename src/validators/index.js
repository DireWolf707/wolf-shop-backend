import { z } from "zod"
import { AppError } from "../utils"

const imageMimeTypes = ["image/jpeg", "image/png"]
export const ImageInput = (image) => {
  if (!image) throw new AppError("no image file uploaded")
  if (!imageMimeTypes.includes(image.mimetype)) throw new AppError("Only .jpg, .jpeg and .png formats are supported")
  return image
}

export const UserInput = z.object({
  name: z.string().trim().min(2).max(200),
  username: z.string().trim().min(2).max(195),
})

export const UserSignupInput = UserInput.extend({
  email: z.string().trim().email(),
})
