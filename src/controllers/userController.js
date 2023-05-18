import { catchAsync, slugify, storage } from "../utils"
import { prisma } from "../configs"
import { UserInput, ImageInput } from "../validators"
import { sessionOptions } from "../middlewares/global"
// import { io } from "../socket"

export const getProfile = (req, res) => res.json({ data: req?.user || null })

export const updateProfile = catchAsync(async (req, res) => {
  const { id } = req.user
  const { username } = req.body

  if (username) req.body.username = slugify(username)
  // validate input
  const data = UserInput.parse(req.body)
  // update user and session
  req.session.passport.user = await prisma.user.update({ data, where: { id } })

  res.json({ data: req.session.passport.user })
})

export const updateAvatar = catchAsync(async (req, res) => {
  const { id, avatar } = req.user

  // validate image
  const image = ImageInput(req?.files?.file)
  // upload new avatar (write/re-write)
  const filename = `avatars/${id}`
  const avatarURL = await storage.upload(filename, image.data)
  // update user and session (write)
  if (!avatar) req.session.passport.user = await prisma.user.update({ data: { avatar: avatarURL }, where: { id } })

  res.json({ data: req.session.passport.user })
})

export const deleteAvatar = catchAsync(async (req, res) => {
  const { id, avatar } = req.user

  if (avatar) {
    // remove avatar
    const filename = `avatars/${id}`
    await storage.delete(filename)
    // update user
    req.session.passport.user = await prisma.user.update({ data: { avatar: null }, where: { id } })
  }

  res.json({ data: req.session.passport.user })
})

export const logout = (req, res) => {
  // const sessionId = req.session.id

  req.session.destroy(() => {
    // io.in(sessionId).disconnectSockets()
    res.clearCookie(sessionOptions.name)
    res.json({ data: null })
  })
}
