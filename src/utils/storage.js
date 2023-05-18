import { gcsBucket } from "../configs"

export default {
  upload: async (filename, buffer) => {
    const file = gcsBucket.file(filename)
    await file.save(buffer)
    await file.makePublic()

    return file.publicUrl()
  },

  delete: async (filename) => {
    const file = gcsBucket.file(filename)
    await file.delete({ ignoreNotFound: true })
  }
}
