import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['manager', 'admin'])
  const parts = await readMultipartFormData(event)
  const image = parts?.find(part => part.name === 'image' && part.filename)
  if (!image?.type || !allowedTypes[image.type]) throw createError({ statusCode: 400, statusMessage: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP และ GIF' })
  if (image.data.length > 5 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'รูปภาพต้องมีขนาดไม่เกิน 5 MB' })

  const extension = allowedTypes[image.type] || extname(image.filename || '')
  const filename = `${crypto.randomUUID()}${extension}`
  const uploadDirectory = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(join(uploadDirectory, filename), image.data)
  return { url: `/uploads/${filename}` }
})
