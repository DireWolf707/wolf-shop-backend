import { readFileSync } from "fs"
import easyinvoice from "easyinvoice"
import path from "path"
import getDirname from "./getDirname"
import storage from "./storage"

export default async ({ user, products, fileName }) => {
  const invoice = await easyinvoice.createInvoice({
    images: { logo: readFileSync(path.join(getDirname(import.meta.url), "../assets/invoice-logo.png"), "base64") },
    sender: { company: "Direwolf Corp", address: "wolf street", zip: "707 DW", city: "Delhi", country: "India" },
    client: { company: user.name, address: user.email },
    information: { number: razorpayOrderId, date: Date.now(), "due-date": Date.now() },
    settings: { currency: "INR" },
    products,
  })

  const invoiceURL = await storage.upload(fileName, Buffer.from(invoice.pdf, "base64"))
  return invoiceURL
}
