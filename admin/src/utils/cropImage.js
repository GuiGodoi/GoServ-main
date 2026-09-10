/**
 * Gera um Blob JPEG a partir do crop do react-easy-crop (área 1:1).
 */
export async function getCroppedImageBlob(imageSrc, pixelCrop, rotation = 0) {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas não disponível')

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(-safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(-safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  const out = document.createElement('canvas')
  out.width = pixelCrop.width
  out.height = pixelCrop.height
  const outCtx = out.getContext('2d')
  outCtx.drawImage(canvas, 0, 0)

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Falha ao gerar imagem'))
        else resolve(blob)
      },
      'image/jpeg',
      0.92
    )
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('Não foi possível carregar a imagem')))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = src
  })
}
