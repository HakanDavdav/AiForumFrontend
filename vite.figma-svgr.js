import { createFilter } from '@rollup/pluginutils'
import fs from 'node:fs'
import path from 'node:path'

// Figma export'larında kart iconlarının ince ayarlı kalınlıkları
const STROKE_TUNING = {
  'Card.svg': { heavy: '8', light: '6', arrow: '6' },
  'Cards.svg': { heavy: '8', light: '6', arrow: '6' },
  'CardContigency.svg': { heavy: '8', light: '5.6', arrow: '4.9' },
  'CardContigencyModifier.svg': { heavy: '8', light: '5.6', arrow: '4.9' },
}

const postfixRE = /[?#].*$/s

export function figmaSvgrPlugin() {
  return {
    name: 'figma-svgr',
    enforce: 'pre',
    async load(id) {
      const filePath = id.replace(postfixRE, '')
      if (!filePath.endsWith('.svg')) return null
      if (!filePath.includes('/FigmaNew/')) return null

      let svgCode = await fs.promises.readFile(filePath, 'utf8')
      // Figma siyah konturlari tema rengine cevir
      svgCode = svgCode
        .replace(/stroke="black"/g, 'stroke="currentColor"')
        .replace(/fill="black"/g, 'fill="currentColor"')

      const tune = STROKE_TUNING[path.basename(filePath)]
      if (tune) {
        svgCode = svgCode
          .replace(/stroke-width="5"/g, `stroke-width="${tune.heavy}"`)
          .replace(/stroke-width="3\.91406"/g, `stroke-width="${tune.light}"`)
          .replace(/stroke-width="3"/g, `stroke-width="${tune.arrow || tune.heavy}"`)
          .replace(/stroke-width="2"/g, `stroke-width="${tune.light}"`)
      }

      // Diğer cardsal SVG'lerin kontur kalınlıklarını da arttır (~1.5x)
      const isCardSvg = /(card|cards)/i.test(path.basename(filePath))
      if (isCardSvg && !tune) {
        svgCode = svgCode.replace(/stroke-width="([\d.]+)"/g, (match, val) => {
          const num = parseFloat(val)
          if (isNaN(num)) return match
          const boosted = Number((num * 1.5).toFixed(2))
          return `stroke-width="${boosted}"`
        })
      }

      const { transform: svgrTransform } = await import('@svgr/core')
      const { default: jsx } = await import('@svgr/plugin-jsx')
      const componentCode = await svgrTransform(
        svgCode,
        {},
        {
          filePath,
          caller: { defaultPlugins: [jsx] },
        }
      )

      if (this?.meta?.rolldownVersion != null) {
        const { transformWithOxc } = await import('vite')
        return {
          code: (await transformWithOxc(componentCode, id, { lang: 'jsx' })).code,
          map: null,
        }
      }
      const { transformWithEsbuild } = await import('vite')
      return {
        code: (await transformWithEsbuild(componentCode, id, { loader: 'jsx' })).code,
        map: null,
      }
    },
  }
}

export function createSvgFilter() {
  return createFilter('**/*.svg?react')
}
