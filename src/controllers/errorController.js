import { AppError } from "../utils"

const handlePayloadTooLargeError = () => new AppError("payload too large")
const handleCastErrorDB = () => new AppError("invalid data")
const handleNotFoundErrorDB = (err) => new AppError(err.meta.cause.replace(".", ""))
const handleLongValueErrorDB = () => new AppError("data too long")
const handleUniqueConstraintErrorDB = (err) => {
  const errors = err.meta.target.map((field) => `${field}:${field} is already in use`)
  const message = errors.join(",")
  return new AppError(message)
}
const handleValidationError = (err) => {
  const errors = err.issues.map(({ path, message }) => `${path[0]}:${message}`)
  const message = errors.join(",")
  return new AppError(message)
}
const handleRazorpayMaxAmountError = () => new AppError("order amount cannot exceed Rs. 5 lakhs")

export default (err, req, res, next) => {
  // express errors
  if (err.type === "entity.too.large") err = handlePayloadTooLargeError()
  // zod errors
  if (err.name === "ZodError") err = handleValidationError(err)
  // prisma errors
  if (err.code === "P2000") err = handleLongValueErrorDB()
  if (err.code === "P2002") err = handleUniqueConstraintErrorDB(err)
  if (err.code === "P2023") err = handleCastErrorDB()
  if (err.code === "P2025") err = handleNotFoundErrorDB(err)
  // razorpay
  if (err.error.step === "payment_initiation") err = handleRazorpayMaxAmountError()

  console.log({ ...err, messsage: err.message })

  // Operational error: send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      message: err.message,
    })
  // Unknown error: don't send error details
  else
    res.status(500).json({
      message: "something went wrong",
    })
}
