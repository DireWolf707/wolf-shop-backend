import { Storage } from "@google-cloud/storage"

const storageClient = new Storage({ credentials: JSON.parse(process.env.GCS_CREDENTIALS) })
const storage = storageClient.bucket(process.env.GCS_BUCKET)

export default storage
