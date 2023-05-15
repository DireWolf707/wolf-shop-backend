import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import prisma from "./prisma"
import razorpay from "./razorpay"
import { randomString, slugify } from "../utils"
import { UserSignupInput } from "../validators"

passport.use(
  new GoogleStrategy(
    {
      clientID: String(process.env.GOOGLE_CLIENT_ID),
      clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
      callbackURL: `${process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL}${process.env.GOOGLE_CALLBACK}`,
      scope: ["email", "profile"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      const { email, given_name: name } = profile._json

      try {
        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          const data = UserSignupInput.parse({ email, name, username: slugify(`${name} ${randomString()}`) })
          const { id: customerId } = await razorpay.customers.create({ name, email, fail_existing: 0 })
          user = await prisma.user.create({ data: { ...data, customerId } })
        }
        cb(null, user)
      } catch (err) {
        cb(err, null)
      }
    }
  )
)

passport.serializeUser((user, done) => done(null, user))

passport.deserializeUser((user, done) => done(null, user))
