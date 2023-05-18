import { Storage } from "@google-cloud/storage"

const gcsStorageClient = new Storage({ credentials: JSON.parse(process.env.GCS_CREDENTIALS) })
const gcsBucket = gcsStorageClient.bucket(process.env.GCS_BUCKET)

export default gcsBucket
