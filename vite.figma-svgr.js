import { createFilter } from '@rollup/pluginutils'
import fs from 'node:fs'
import path from 'node:path'

// Figma export'larında kart iconlarının ince ayarlı kalınlıkları (3->heavy, 2->light)
const STROKE_TUNING = {
  'CardContigency.svg': { heavy: '8', light: '5.3' },
  'CardContigencyModifier.svg': { heavy: '9', light: '6' },
  'Card.svg': { heavy: '5', light: '5' },
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
          .replace(/stroke-width="3"/g, `stroke-width="${tune.heavy}"`)
          .replace(/stroke-width="2"/g, `stroke-width="${tune.light}"`)
      }

      const { transform: svgrTransform } = await import('@svgr/core')
      const { default: jsx } = await import('@svgr/plugin-jsx')
      const componentCode = await svgrTransform(svgCode, {}, {
        filePath,
        caller: { defaultPlugins: [jsx] },
      })

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
