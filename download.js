const fs = require('fs')
const { default: axios } = require("axios")
const { APIv2 } = require("google-font-metadata")
const async = require('async')

const FONTS_PATH = process.env.FONTS_PATH || '/var/www/fonts'

let fontsToDownload = []

const downloadQueue = async (font, cb) => {
  await downloadFont(font)
  cb()
}

const queue = async.queue(downloadQueue, 60)

async function downloadFonts () {
  const fonts = Object.keys(APIv2)
  fonts.forEach(fontKey => {
    const font = APIv2[fontKey]
    const variants = Object.keys(font.variants)
    variants.forEach(variantKey => {
      const styles = Object.keys(font.variants[variantKey])
      styles.forEach(styleKey => {
        const { latin } = font.variants[variantKey][styleKey]
        if (latin) {
          const fontUrl = latin.url.truetype

          const fontFile = `${font.id}-${variantKey}-${styleKey}.ttf`
          const fontPath = `${FONTS_PATH}/${fontFile}`

          fontsToDownload.push({
            url: fontUrl,
            path: fontPath,
            fontName: font.family,
            id: font.id,
            weight: variantKey,
            style: styleKey
          })
        }
      })
    })
  })

  for (const font of fontsToDownload) {
    queue.push(font)
  }

  await queue.drain()

  // Create a METADATA file
  const metadataBuffer = new Buffer(JSON.stringify(fontsToDownload))
  fs.writeFileSync(`${FONTS_PATH}/METADATA.json`, metadataBuffer)
  console.log(`Write METADATA file: ${FONTS_PATH}/METADATA.json`)
}

function downloadFont (font) {
  return axios.get(font.url, {
      responseType: 'arraybuffer'
    })
    .then(response => {
      fs.writeFile(font.path, response.data, () => {
        console.log(`Write font file: ${font.path}`)
      })
    })
    .catch(err => {
      console.log(err)
    })
}

downloadFonts()
