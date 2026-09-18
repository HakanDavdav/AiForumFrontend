import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'
import { ArrowLeft, Loader2, Brain, Focus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

export function getNodeLabelText(label, isRoot = false, isTribeContext = false) {
  if (label === 'Persona') {
    return i18n.t('mind.labels.persona', 'Persona')
  }
  if (label === 'Tribe' && isRoot) {
    return i18n.t('mind.labels.tribe_root', 'Tribe (Root)')
  }
  if (label === 'Tribe' && isTribeContext) {
    return i18n.t('mind.labels.other_tribes', 'Other Tribes')
  }
  if (label === 'Tribe') {
    return i18n.t('mind.labels.tribe', 'Tribe')
  }
  if (label === 'Actor' || label === 'User' || label === 'Bot') {
    return i18n.t('mind.labels.actor', 'Actor')
  }
  if (label === 'GeneralThought' || label === 'Topic' || label === 'Concept' || label === 'Thought') {
    return i18n.t('mind.labels.general_thought', 'GeneralThought')
  }
  return label || ''
}

// Nöron renk paleti — Koyu arka planda biyolüminesans tonlar
// (Persona/Merkez düğüm dinamik olarak tema rengine [Yeşil/Mavi] bağlanır)
const NEURON_COLORS = {
  Tribe: { core: '#c084fc', glow: '#a855f7' },          // Asil Mor (Topluluklar)
  Actor: { core: '#f97316', glow: '#ea580c' },          // Canlı Turuncu / Mercan (Diğer Kullanıcı & Botlar)
  GeneralThought: { core: '#facc15', glow: '#eab308' }, // Parlak Altın Sarısı (Düşünceler, Fikirler, Konular)
  default: { core: '#e879f9', glow: '#d946ef' },        // Fuşya
}

function getNeuronColor(label, isRoot = false) {
  const isGreen = useThemeStore.getState().isGreenMode
  if (label === 'Persona' || isRoot) {
    return isGreen
      ? { core: '#10b981', glow: '#059669' } // Canlı Zümrüt Yeşili
      : { core: '#3b82f6', glow: '#1d4ed8' } // Siber Mavi
  }
  return NEURON_COLORS[label] || NEURON_COLORS.default
}

// Nöron görsel dokuları ve rozet önbelleği (MindAmbience estetiği)
const nodeTextureCache = new Map()
const nodeBadgeCache = new Map()

function getNodeVisualTextures(coreColor, glowColor) {
  const cacheKey = `${coreColor}_${glowColor}`
  if (nodeTextureCache.has(cacheKey)) {
    return nodeTextureCache.get(cacheKey)
  }

  // 1. Halo Canvas (MindAmbience radyal gradyan halesi - <radialGradient>)
  const haloCanvas = document.createElement('canvas')
  const haloSize = 256
  haloCanvas.width = haloSize
  haloCanvas.height = haloSize
  const hCtx = haloCanvas.getContext('2d')
  const hCenter = haloSize / 2
  const hGrad = hCtx.createRadialGradient(hCenter, hCenter, 0, hCenter, hCenter, hCenter)
  hGrad.addColorStop(0, coreColor)
  hGrad.addColorStop(0.45, glowColor)
  hGrad.addColorStop(0.80, glowColor)
  hGrad.addColorStop(1, 'rgba(0,0,0,0)')
  hCtx.fillStyle = hGrad
  hCtx.fillRect(0, 0, haloSize, haloSize)
  const haloTex = new THREE.CanvasTexture(haloCanvas)

  // 2. Pearl Face Canvas (MindAmbience: core circle + sol-üst beyaz parlaklık merkezi)
  const pearlCanvas = document.createElement('canvas')
  const pearlSize = 256
  pearlCanvas.width = pearlSize
  pearlCanvas.height = pearlSize
  const pCtx = pearlCanvas.getContext('2d')
  const pCenter = pearlSize / 2
  const pR = (pearlSize / 2) * 0.76

  // Dış ışıma
  pCtx.save()
  pCtx.shadowColor = glowColor
  pCtx.shadowBlur = 24
  pCtx.fillStyle = coreColor
  pCtx.beginPath()
  pCtx.arc(pCenter, pCenter, pR, 0, Math.PI * 2)
  pCtx.fill()
  pCtx.restore()

  // Biyolüminesans çekirdek gradyanı
  const coreGrad = pCtx.createRadialGradient(
    pCenter - pR * 0.28,
    pCenter - pR * 0.28,
    pR * 0.04,
    pCenter,
    pCenter,
    pR
  )
  coreGrad.addColorStop(0, '#ffffff')
  coreGrad.addColorStop(0.30, coreColor)
  coreGrad.addColorStop(1, glowColor)
  pCtx.fillStyle = coreGrad
  pCtx.beginPath()
  pCtx.arc(pCenter, pCenter, pR, 0, Math.PI * 2)
  pCtx.fill()

  // MindAmbience: Beyaz parlaklık merkezi (Specular Glint)
  // cx={node.x - node.r * 0.28} cy={node.y - node.r * 0.28} r={node.r * 0.32} fill="#ffffff" opacity="0.85"
  pCtx.save()
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  pCtx.shadowColor = '#ffffff'
  pCtx.shadowBlur = 12
  pCtx.beginPath()
  pCtx.arc(pCenter - pR * 0.28, pCenter - pR * 0.28, pR * 0.32, 0, Math.PI * 2)
  pCtx.fill()
  pCtx.restore()

  const pearlTex = new THREE.CanvasTexture(pearlCanvas)

  const result = { haloTex, pearlTex }
  nodeTextureCache.set(cacheKey, result)
  return result
}

// 3D Canvas Düğüm Bilgi Bloğu (MindAmbience tarzı sade, zarif, okunaklı cam kart)
function buildNodeBlock(node, core, glow, isPersona, r) {
  let titleText = node.name || node.label
  if (titleText.length > 22) {
    titleText = titleText.substring(0, 22) + '...'
  }
  const subtitleText = getNodeLabelText(node.label, isPersona, Boolean(node.isTribeContext))
  const lang = i18n.language || 'tr'
  const cacheKey = `${titleText}_${subtitleText}_${core}_${glow}_${isPersona}_${lang}_v3`

  let tex = nodeBadgeCache.get(cacheKey)
  if (!tex) {
    // 2x Retina ölçeği ile kristal netliğinde çizim
    const scale = 2
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.font = '700 28px Inter, sans-serif'
    const titleWidth = tempCtx.measureText(titleText).width
    tempCtx.font = '600 18px Inter, sans-serif'
    const subtitleWidth = tempCtx.measureText(subtitleText.toUpperCase()).width
    const textWidth = Math.max(titleWidth, subtitleWidth)

    const padX = 36 * scale
    const cardW = Math.max(140 * scale, textWidth + padX)
    const cardH = 58 * scale

    const canvas = document.createElement('canvas')
    canvas.width = cardW + 12
    canvas.height = cardH + 12
    const ctx = canvas.getContext('2d')

    const ox = 6
    const oy = 6

    // MindAmbience sade cam kart: fill="rgba(10, 5, 20, 0.90)" stroke={core}
    ctx.fillStyle = isPersona ? 'rgba(8, 4, 20, 0.94)' : 'rgba(10, 5, 20, 0.90)'
    ctx.beginPath()
    ctx.roundRect(ox, oy, cardW, cardH, 8 * scale)
    ctx.fill()

    ctx.strokeStyle = core
    ctx.lineWidth = 1.6 * scale
    ctx.stroke()

    // Başlık (Beyaz, net Inter)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const centerX = canvas.width / 2

    ctx.font = '700 28px Inter, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(titleText, centerX, oy + 20 * scale)

    // Alt etiket (Tema rengi, sade, opacity: 0.90)
    ctx.font = '600 18px Inter, sans-serif'
    ctx.fillStyle = glow
    ctx.globalAlpha = 0.90
    ctx.fillText(subtitleText.toUpperCase(), centerX, oy + 42 * scale)
    ctx.globalAlpha = 1.0

    tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.userData = { cardW: cardW / scale, cardH: cardH / scale }
    nodeBadgeCache.set(cacheKey, tex)
  }

  const baseW = tex.userData?.cardW || 140
  const baseH = tex.userData?.cardH || 58

  const badgeMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  // Rahatça okunabilecek belirgin ve dengeli 3D boyutu
  const scaleFactor = isPersona ? 0.72 : 0.56
  const meshW = baseW * scaleFactor
  const meshH = baseH * scaleFactor

  const badgeGeo = new THREE.PlaneGeometry(meshW, meshH)
  const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat)

  // Düğümün hemen üstünde estetik süzülme
  badgeMesh.position.set(0, r + meshH * 0.5 + 6, 0)
  badgeMesh.renderOrder = 9999999
  badgeMesh.userData = { isBadge: true }

  badgeMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }

  return badgeMesh
}

// Three.js ile parlayan nöron nesnesi oluştur (MindAmbience estetiğiyle birebir)
function buildNeuronObject(node) {
  const isRoot = node.label === 'Persona' || (node.label === 'Tribe' && node.isRoot)
  const isPersona = isRoot
  const isActive = Boolean(node.isActive) // Active Synapse highlight

  // Active node'lar için altın-amber rengi; diğerleri normal renk paleti
  const { core, glow } = isActive
    ? { core: '#fbbf24', glow: '#f59e0b' }
    : getNeuronColor(node.label, isRoot)

  const group = new THREE.Group()

  // MindAmbience oranları: Persona hafifçe daha büyük (22 vs 13); Active node'lar %30 daha büyük
  const baseR = isPersona ? 22 : (node.label === 'GeneralThought' || node.label === 'Topic' ? 15 : 12)
  const r = isActive ? Math.round(baseR * 1.35) : baseR

  // Biyolüminesans süzülme için alt grup (MindAmbience mindFloatCenter)
  const visualGroup = new THREE.Group()
  visualGroup.userData = {
    isVisualGroup: true,
    isPersonaNode: isPersona,
    seed: (strHash(node.id || node.name || 'node') % 1000) / 1000,
  }

  const { haloTex, pearlTex } = getNodeVisualTextures(core, glow)

  // 1. Dış en yumuşak ışıma (MindAmbience r * 2.8 radyal gradyan halesi - mindPulseHalo)
  // Active node'larda halo daha geniş ve opaque
  const haloSize = isActive ? r * 7.2 : r * 5.6
  const haloGeo = new THREE.PlaneGeometry(haloSize, haloSize)
  const haloOpacity = isActive ? 0.65 : (isPersona ? 0.45 : 0.32)
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    opacity: haloOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const haloMesh = new THREE.Mesh(haloGeo, haloMat)
  haloMesh.userData = { isHalo: true, isPersona: isPersona, baseOpacity: haloOpacity }
  haloMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }
  visualGroup.add(haloMesh)

  // 2. Orta hale küresi (MindAmbience r * 1.6 - fill={node.glow} opacity="0.32")
  const midHaloGeo = new THREE.SphereGeometry(r * 1.55, 20, 20)
  const midHaloMat = new THREE.MeshBasicMaterial({
    color: glow,
    transparent: true,
    opacity: isActive ? 0.5 : (isPersona ? 0.32 : 0.22),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  visualGroup.add(new THREE.Mesh(midHaloGeo, midHaloMat))

  // 3. 3D İç Fiziksel Çekirdek Küresi (Tıklama ve 3D derinlik)
  const coreSphereGeo = new THREE.SphereGeometry(r, 28, 28)
  const coreSphereMat = new THREE.MeshBasicMaterial({ color: core })
  visualGroup.add(new THREE.Mesh(coreSphereGeo, coreSphereMat))

  // 4. Biyolüminesans Pearl Yüzeyi ve Beyaz Parlaklık Merkezi (MindAmbience Glossy Pearl Face)
  // Kameraya dönük parlak pearl diski: Çekirdek rengi + sol üst beyaz parlaklık noktası (Specular Glint)
  const pearlGeo = new THREE.PlaneGeometry(r * 2.15, r * 2.15)
  const pearlMat = new THREE.MeshBasicMaterial({
    map: pearlTex,
    transparent: true,
    depthWrite: false,
  })
  const pearlMesh = new THREE.Mesh(pearlGeo, pearlMat)
  pearlMesh.renderOrder = 999
  pearlMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }
  visualGroup.add(pearlMesh)

  // 5. Düğüm Başlık Bloğu (Orijinal 3D Canvas Kart Yapısı)
  const badgeMesh = buildNodeBlock(node, core, glow, isPersona, r)
  visualGroup.add(badgeMesh)

  // 6. Active Synapse ring — extra dış ışıma halkası aktif node'larda
  if (isActive) {
    const ringGeo = new THREE.RingGeometry(r * 1.7, r * 2.1, 48)
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.userData = { isHalo: true, isPersona: false, baseOpacity: 0.55 }
    ringMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }
    visualGroup.add(ringMesh)
  }

  group.add(visualGroup)
  return group
}

// ─── Kılcal Damar Geometrisi ──────────────────────────────────────────────────

// Basit seeded random — her link için tutarlı ama unique organik şekil
function makeRng(seed) {
  let s = Math.abs(seed) % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// String'den basit hash
function strHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Global shader uniforms (Biyolüminesans elektrik impulsu)
const isInitialGreen = typeof useThemeStore !== 'undefined' ? useThemeStore.getState().isGreenMode : false
const globalUniforms = {
  uTime: { value: 0 },
  uPulseColor: {
    value: new THREE.Vector3(
      isInitialGreen ? 0.2 : 0.23,
      isInitialGreen ? 0.83 : 0.51,
      isInitialGreen ? 0.6 : 0.98
    ),
  },
}

// ─── MindAmbience Sinaps Bağlantı Materyalleri ────────────────────────────────
// 1. Sinaps ana omurga yolu (MindAmbience stroke="var(--color-border)" strokeWidth="1.6" strokeOpacity="0.5")
const _synapseTrackMat = new THREE.MeshBasicMaterial({
  color: isInitialGreen ? '#064e3b' : '#1e293b',
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
})

// 2. Sinaps dış eterik ışıma halesi (MindAmbience filter="url(#synapseGlow)" strokeOpacity="0.15")
const _synapseHaloMat = new THREE.MeshBasicMaterial({
  color: isInitialGreen ? '#10b981' : '#3b82f6',
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

// 3. Akıcı nöral kesikli elektrik sinyali shader'ı (MindAmbience strokeDasharray="6 14" ve @keyframes mindSynapseDash)
const _synapseDashShaderMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: globalUniforms.uTime,
    uColor: {
      value: new THREE.Color(isInitialGreen ? '#34d399' : '#60a5fa'),
    },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // vUv.x tüp boyunca (başlangıçtan bitişe) 0..1 arası akar
      // MindAmbience akıcı kesikli sinyal çizgisi ritmi
      float speed = 3.2;
      float segments = 22.0;
      float stream = fract(vUv.x * segments - uTime * speed);

      // MindAmbience "6 14" oranı: ~%30 çizgi, ~%70 boşluk
      float dash = smoothstep(0.0, 0.06, stream) * (1.0 - smoothstep(0.28, 0.35, stream));

      if (dash < 0.02) discard;

      // Beyaz-sıcak elektrik kıvılcım çekirdeği + neon gövde
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 electricColor = mix(uColor, coreWhite, pow(dash, 1.8) * 0.75);

      gl_FragColor = vec4(electricColor, dash * 0.95);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
})

// 4. Seyahat eden darbe küresi (Traveling Pulse Orb) ışıma materyalleri
const _orbGlowMat = new THREE.MeshBasicMaterial({
  color: isInitialGreen ? '#34d399' : '#60a5fa',
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const _orbCoronaMat = new THREE.MeshBasicMaterial({
  color: isInitialGreen ? '#10b981' : '#3b82f6',
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const linkLabelCache = new Map()

function buildCapillaryObject(link) {
  const g = new THREE.Group()
  g.userData._built = false

  if (link && link.name) {
    if (!linkLabelCache.has(link.name)) {
      const isGreen = useThemeStore.getState().isGreenMode
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.font = 'bold 44px Inter, sans-serif'
      const textWidth = ctx.measureText(link.name).width

      const rectWidth = Math.max(180, textWidth + 90)
      canvas.width = rectWidth + 24
      canvas.height = 96

      ctx.fillStyle = 'rgba(10, 15, 25, 0.9)'
      ctx.beginPath()
      ctx.roundRect(12, 12, rectWidth, 72, 18)
      ctx.fill()
      ctx.strokeStyle = isGreen ? '#10b981' : '#3b82f6'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 44px Inter, sans-serif'
      ctx.fillStyle = isGreen ? '#a7f3d0' : '#bfdbfe'
      ctx.fillText(link.name, canvas.width / 2, 48)

      const tex = new THREE.CanvasTexture(canvas)
      tex.minFilter = THREE.LinearFilter

      const labelMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })

      const scaleX = (canvas.width / 400) * 44
      linkLabelCache.set(link.name, { mat: labelMat, width: scaleX })
    }

    const { mat, width } = linkLabelCache.get(link.name)
    const baseScale = 2.1 // Bağlantı blokçuğu boyutu büyütüldü
    const labelGeo = new THREE.PlaneGeometry(width * baseScale, 9.6 * baseScale)
    const labelMesh = new THREE.Mesh(labelGeo, mat)

    labelMesh.renderOrder = 9999998
    labelMesh.userData = { isLinkLabel: true, link: link }

    labelMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }

    g.add(labelMesh)
  }

  return g
}

// Temiz, organik kavisli sinaps hattı ve seyahat eden darbe küresi oluşturucu (MindAmbience stili)
function updateCapillaryPosition(obj, { start, end }, link) {
  const sv = new THREE.Vector3(start.x, start.y, start.z)
  const ev = new THREE.Vector3(end.x, end.y, end.z)
  const len = sv.distanceTo(ev)
  if (len < 1) return true

  // Pozisyon cache — gereksiz yeniden çizimi önle
  const posKey = `${start.x.toFixed(0)},${start.y.toFixed(0)},${start.z?.toFixed(0) || 0},${end.x.toFixed(0)},${end.y.toFixed(0)},${end.z?.toFixed(0) || 0}`
  if (obj.userData._posKey === posKey) return true
  obj.userData._posKey = posKey

  // Organik kavis için yay (MindAmbience beziere eğrisi gibi dışa doğru kavisli kubbe)
  const mid = new THREE.Vector3().addVectors(sv, ev).multiplyScalar(0.5)
  const dir = new THREE.Vector3().subVectors(ev, sv)
  const dirNorm = dir.clone().normalize()

  // Merkezden dışa doğru radyal yayılma vektörü
  const radial = mid.clone().normalize()
  const dot = radial.dot(dirNorm)
  const perp = radial.sub(dirNorm.clone().multiplyScalar(dot)).normalize()

  // Tohum değerine göre kavis yönü ve dış bükey kubbe eğimi
  const seedVal = strHash(link?.id || link?.name || 'seed')
  const bowAmount = Math.min(len * 0.16, 42)
  mid.addScaledVector(perp, bowAmount)

  const curve = new THREE.QuadraticBezierCurve3(sv, mid, ev)
  obj.userData.curve = curve
  obj.userData.seed = (seedVal % 1000) / 1000

  // Önceki geometrileri temizle, ancak etiket ve orb'u koru
  const toRemove = []
  obj.children.forEach((c) => {
    if (c.userData && (c.userData.isLinkLabel || c.userData.isPulseOrb)) {
      if (c.userData.isLinkLabel) {
        c.position.copy(curve.getPoint(0.5))
        c.position.y += 6
      }
    } else {
      c.geometry?.dispose()
      toRemove.push(c)
    }
  })
  toRemove.forEach((c) => obj.remove(c))

  // 1. Dış yumuşak ışıma kılıfı (Halo - MindAmbience filter="url(#synapseGlow)" stili)
  const haloGeo = new THREE.TubeGeometry(curve, 24, 1.5, 6, false)
  const haloMesh = new THREE.Mesh(haloGeo, _synapseHaloMat)
  haloMesh.renderOrder = -1000
  obj.add(haloMesh)

  // 2. Akıcı nöral kesikli çizgi tüpü (MindAmbience strokeDasharray="6 14" akışı)
  const dashGeo = new THREE.TubeGeometry(curve, 32, 0.7, 6, false)
  const dashMesh = new THREE.Mesh(dashGeo, _synapseDashShaderMat)
  dashMesh.renderOrder = -999
  obj.add(dashMesh)

  // 3. İç ana omurga yolu (Base track - MindAmbience stroke="var(--color-border)")
  const trackGeo = new THREE.TubeGeometry(curve, 28, 0.42, 6, false)
  const trackMesh = new THREE.Mesh(trackGeo, _synapseTrackMat)
  trackMesh.renderOrder = -998
  obj.add(trackMesh)

  // 4. Hat boyunca seyahat eden parıltılı enerji küresi (Pulse Orb - MindAmbience <circle> darbesi)
  let pulseOrb = obj.children.find((c) => c.userData && c.userData.isPulseOrb)
  if (!pulseOrb) {
    pulseOrb = new THREE.Group()
    pulseOrb.userData = { isPulseOrb: true }
    // Beyaz-sıcak parlak çekirdek (MindAmbience r="3.5" fill="#ffffff")
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    )
    // Renkli parıldayan yoğun neon iç hale (MindAmbience r="7" fill={personaColors.core} opacity="0.45")
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 16),
      _orbGlowMat
    )
    // Geniş eterik dış korona
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(7.2, 12, 12),
      _orbCoronaMat
    )
    pulseOrb.add(inner)
    pulseOrb.add(outer)
    pulseOrb.add(corona)
    pulseOrb.renderOrder = -990
    obj.add(pulseOrb)
  }
  obj.userData.pulseOrb = pulseOrb
  pulseOrb.position.copy(curve.getPoint(0))

  return true
}

// TopBar yüksekliği — CSS değişkeninden okunuyor
const TOPBAR_HEIGHT = 'var(--topbar-height)'

function NodeDetailPanel({ node, onClose, isTribeContext = false }) {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeStore()
  const isRoot = node.label === 'Persona' || (node.label === 'Tribe' && node.isRoot)
  const { core, glow } = getNeuronColor(node.label, isRoot)

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxHeight: '85vh',
        overflowY: 'auto',
        background: isDarkMode ? 'rgba(10, 5, 20, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: isDarkMode ? `1px solid rgba(192,132,252,0.2)` : `1px solid rgba(0,0,0,0.1)`,
        borderTop: `4px solid ${core}`,
        borderRadius: 24,
        padding: 32,
        color: isDarkMode ? '#f0e6ff' : '#000000',
        boxShadow: isDarkMode ? `0 32px 80px rgba(0,0,0,0.9), inset 0 0 40px rgba(192,132,252,0.1)` : `0 32px 80px rgba(0,0,0,0.1)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        zIndex: 1000,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: core,
              boxShadow: `0 0 16px ${glow}`,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 11,
                color: core,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {node.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
              {node.name || t('mind.unknown_node', 'Unknown Node')}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            color: isDarkMode ? '#fff' : '#000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')}
        >
          ✕
        </button>
      </div>

      {node.isActive && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            color: '#f59e0b',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>🧠</span>
          <span>{t('mind.recalled_for_content', 'Bu düşünce seçilen içerikte tetiklendi.')}</span>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, rgba(59,130,246,0.3) 0%, transparent 100%)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(node).map(([key, value]) => {
          // Grafik içi gereksiz 3D koordinat ve dahili durum bilgilerini filtrele
          if (
            ['id', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', 'name', 'label', 'val', 'color', 'isRoot', 'embedding', '__indexColor', '__threeObj'].includes(key) ||
            typeof value === 'object'
          )
            return null
          return (
            <div
              key={key}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                padding: '12px 16px',
                borderRadius: 12,
                border: isDarkMode ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: isDarkMode ? 'rgba(192,132,252,0.7)' : 'rgba(0,0,0,0.5)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                {key === 'lastUpdated' ? t('mind.last_updated', 'Son Güncelleme') : key}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: isDarkMode ? '#e0d4f5' : '#374151',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {key === 'lastUpdated' && typeof value === 'number' 
                  ? new Date(value).toLocaleString() 
                  : String(value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MindPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const actorId = searchParams.get('actorId')
  const tribeId = searchParams.get('tribeId')
  const focusNodeParam = searchParams.get('focusNode')
  const queryName = searchParams.get('name') || location.state?.name || location.state?.profileName || null
  const contextTitle =
    searchParams.get('contextTitle') ||
    searchParams.get('title') ||
    location.state?.contextTitle ||
    location.state?.title ||
    location.state?.proposition ||
    null

  // Comma-separated Neo4j node UUIDs to highlight (directly from searchParams)
  const highlightIds = useMemo(() => {
    const raw = searchParams.get('highlightIds') || ''
    return new Set(raw ? raw.split(',').map((id) => id.trim()).filter(Boolean) : [])
  }, [searchParams])
  const [rootName, setRootName] = useState(queryName)
  const navigate = useNavigate()
  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)

  const bgColor = isDarkMode ? '#09090b' : '#ffffff'
  const headerBg = isDarkMode ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)'
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'

  useEffect(() => {
    linkLabelCache.clear()
    nodeTextureCache.clear()
    nodeBadgeCache.clear()
    const green = isGreenMode
    _synapseTrackMat.color.set(green ? '#064e3b' : '#1e293b')
    _synapseHaloMat.color.set(green ? '#10b981' : '#3b82f6')
    _synapseHaloMat.opacity = green ? 0.18 : 0.15
    _orbGlowMat.color.set(green ? '#34d399' : '#60a5fa')
    _orbCoronaMat.color.set(green ? '#10b981' : '#3b82f6')

    if (_synapseDashShaderMat.uniforms.uColor) {
      _synapseDashShaderMat.uniforms.uColor.value.set(green ? '#34d399' : '#60a5fa')
    }

    globalUniforms.uPulseColor.value.set(
      green ? 0.2 : 0.23,
      green ? 0.83 : 0.51,
      green ? 0.6 : 0.98
    )
    if (fgRef.current) {
      fgRef.current.refresh()
    }
  }, [isGreenMode])

  const [isLoading, setIsLoading] = useState(true)
  const [rawData, setRawData] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeSearch, setNodeSearch] = useState('')
  const [isNodeListCollapsed, setIsNodeListCollapsed] = useState(false)

  const fgRef = useRef()
  const containerRef = useRef()
  const isInitialZoomRef = useRef(true)
  const hoveredLinkRef = useRef(null)
  const selectedLinkRef = useRef(null)
  const selectedNodeRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    selectedNodeRef.current = selectedNode
  }, [selectedNode])

  // Shader'lar için global zaman sayacı ve animasyonlar
  useEffect(() => {
    let frameId
    const startTime = Date.now()
    const updateTime = () => {
      const nowSec = (Date.now() - startTime) / 1000
      globalUniforms.uTime.value = nowSec

      // Persona süzülme, haleler, seyahat eden sinaps orbları ve etiketler
      if (fgRef.current) {
        const scene = fgRef.current.scene()
        scene.traverse((obj) => {
          if (obj.userData && obj.userData.isVisualGroup) {
            const speed = obj.userData.isPersonaNode ? 1.3 : 1.1
            const seed = obj.userData.seed || 0
            // MindAmbience mindFloatCenter süzülme animasyonu
            obj.position.y = Math.sin(nowSec * speed + seed) * (obj.userData.isPersonaNode ? 4.5 : 2.8)
          }
          if (obj.userData && obj.userData.isHalo) {
            // MindAmbience mindPulseHalo 3s nefes alma
            const p = 1.0 + Math.sin(nowSec * 2.1) * 0.08
            obj.scale.set(p, p, 1)
            if (obj.material) {
              obj.material.opacity = obj.userData.baseOpacity * (0.85 + Math.sin(nowSec * 2.1) * 0.15)
            }
          }
          if (obj.userData && obj.userData.curve && obj.userData.pulseOrb) {
            const speed = 0.38
            const seed = obj.userData.seed || 0
            const t = (nowSec * speed + seed) % 1
            obj.userData.pulseOrb.position.copy(obj.userData.curve.getPoint(t))
            // Uç noktalara yaklaşırken yumuşak nefes alma (fade in/out)
            const fade = Math.sin(t * Math.PI)
            obj.userData.pulseOrb.scale.setScalar(Math.max(0.01, fade))
          }
          if (obj.userData && obj.userData.isLinkLabel) {
            const isHovered = obj.userData.link === hoveredLinkRef.current
            const isSelected = obj.userData.link === selectedLinkRef.current
            const targetScale = isHovered || isSelected ? 2.2 : 1.0 // Üzerine gelince 2.2 katına çıkar
            obj.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
          }
        })
      }

      frameId = requestAnimationFrame(updateTime)
    }
    updateTime()
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect
        setDimensions({ width, height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!actorId && !tribeId) {
      toast.error(t('mind.id_missing', 'Actor or Tribe ID is missing.'))
      navigate('/')
      return
    }

    const fetchMemory = async () => {
      setIsLoading(true)
      try {
        const [memoryRes, profileRes] = await Promise.allSettled([
          actorId ? actorApi.getFullMemory(actorId) : tribeApi.getFullMemory(tribeId),
          actorId ? actorApi.getProfile(actorId) : tribeApi.getTribe(tribeId),
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value?.data?.succeeded) {
          const pData = profileRes.value.data.data
          const resolvedName = pData?.profileName || pData?.tribeName || pData?.name
          if (resolvedName) {
            setRootName(resolvedName)
          }
        }

        if (memoryRes.status === 'fulfilled') {
          const response = memoryRes.value
          if (response.data.succeeded) {
            if (response.data.data) {
              try {
                const parsedData = JSON.parse(response.data.data)
                setRawData(parsedData)
              } catch (e) {
                console.error('Failed to parse neo4j output:', e)
                toast.error(t('mind.parse_error', 'Failed to parse memory data.'))
                setRawData([])
              }
            } else {
              setRawData([])
            }
          } else {
            toast.error(response.data.errors?.[0]?.description || t('mind.fetch_error', 'Failed to fetch memory.'))
          }
        } else {
          console.error(memoryRes.reason)
          toast.error(t('mind.generic_error', 'An error occurred while fetching memory.'))
        }
      } catch (error) {
        console.error(error)
        toast.error(t('mind.generic_error', 'An error occurred while fetching memory.'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemory()
  }, [actorId, tribeId, navigate, t])

  const graphData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return { nodes: [], links: [] }

    const nodesMap = new Map()
    const linksSet = new Set()
    const linksArr = []

    rawData.forEach((path) => {
      const pathNodes = path.Nodes || []
      const pathRels = path.Relationships || []

      // Add nodes
      pathNodes.forEach((n, idx) => {
        const nodeId = n.id || n.name || JSON.stringify(n)
        if (!nodesMap.has(nodeId)) {
          const isRoot = n.label === 'Persona' || (n.label === 'Tribe' && (n.id === tribeId || idx === 0))
          const isFocusMatched = focusNodeParam && n.name && n.name.toLowerCase() === focusNodeParam.toLowerCase()
          const isActive = (highlightIds.size > 0 && nodeId && highlightIds.has(nodeId)) || Boolean(isFocusMatched)
          const { core } = isActive
            ? { core: '#fbbf24' }
            : getNeuronColor(n.label, isRoot)

          let displayName = n.name || nodeId
          // Kök düğümde GUID yerine aktörün/grubun gerçek kullanıcı adını ver
          if (isRoot && rootName) {
            displayName = rootName
          }

          nodesMap.set(nodeId, {
            ...n,
            id: nodeId,
            name: displayName,
            label: n.label,
            isRoot,
            isActive,
            isTribeContext: Boolean(tribeId),
            val: isRoot ? 200 : (isActive ? 18 : 10),
            color: core,
          })
        }
      })

      // Construct links
      for (let i = 0; i < pathRels.length; i++) {
        if (i + 1 < pathNodes.length) {
          const sourceId = pathNodes[i].id || pathNodes[i].name || JSON.stringify(pathNodes[i])
          const targetId =
            pathNodes[i + 1].id || pathNodes[i + 1].name || JSON.stringify(pathNodes[i + 1])
          const rawRel = pathRels[i]
          const relType = typeof rawRel === 'object' ? rawRel?.type : rawRel
          const affinity = typeof rawRel === 'object' ? rawRel?.affinity : null

          const linkKey = `${sourceId}-${relType}-${targetId}`
          if (!linksSet.has(linkKey)) {
            linksSet.add(linkKey)
            const displayName = affinity != null && affinity !== 0
              ? `${relType} (${affinity > 0 ? '+' : ''}${affinity})`
              : relType

            linksArr.push({
              source: sourceId,
              target: targetId,
              name: displayName,
              relType,
              affinity,
            })
          }
        }
      }
    })

    const nodes = Array.from(nodesMap.values())
    const nonRoot = nodes.filter((n) => !n.isRoot)
    const total = nonRoot.length || 1

    // Root merkeze, diğerleri Fibonacci küre üzerine dağıt
    nodes.forEach((node) => {
      if (node.isRoot) {
        node.x = 0
        node.y = 0
        node.z = 0
      }
    })
    nonRoot.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / total)
      const theta = Math.sqrt(total * Math.PI) * phi
      const r = 280 + (i % 3) * 60 // 280-400 birim arasında hafif varyasyon
      node.x = r * Math.sin(phi) * Math.cos(theta)
      node.y = r * Math.sin(phi) * Math.sin(theta)
      node.z = r * Math.cos(phi)
    })

    return {
      nodes,
      links: linksArr,
    }
  }, [rawData, tribeId, actorId, rootName, highlightIds, focusNodeParam])

  const sortedNodes = useMemo(() => {
    return [...graphData.nodes].sort((a, b) => {
      if (a.isRoot && !b.isRoot) return -1
      if (!a.isRoot && b.isRoot) return 1
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [graphData.nodes])

  // Active Synapse: highlightIds veya focusNode varsa yükleme sonrası toast + ilk aktif node'a zoom & detay paneli açma
  const highlightedActiveNodes = useMemo(
    () => graphData.nodes.filter((n) => n.isActive),
    [graphData.nodes]
  )
  const hasHandledHighlightRef = useRef(false)

  useEffect(() => {
    if (isLoading || graphData.nodes.length === 0) return

    if (highlightedActiveNodes.length > 0) {
      if (hasHandledHighlightRef.current) return
      hasHandledHighlightRef.current = true

      const first = highlightedActiveNodes[0]
      toast.success(
        t('mind.active_synapse', `${highlightedActiveNodes.length} aktif sinaps düğümü hafıza çağrışımıyla vurgulandı.`, { count: highlightedActiveNodes.length }),
        { duration: 4000, icon: '🧠' }
      )
      // İlk aktif node'un detay panelini aç
      selectedNodeRef.current = first
      setSelectedNode(first)

      // 600ms sonra ilk aktif node'a zoom yap
      const tid = setTimeout(() => {
        if (!fgRef.current || first.x == null) return
        fgRef.current.cameraPosition(
          { x: first.x * 1.3, y: (first.y ?? 0) * 1.3 + 80, z: (first.z ?? 0) * 1.3 + 350 },
          { x: first.x, y: first.y ?? 0, z: first.z ?? 0 },
          1200
        )
      }, 600)
      return () => clearTimeout(tid)
    } else if ((highlightIds.size > 0 && highlightedActiveNodes.length === 0) || focusNodeParam) {
      if (hasHandledHighlightRef.current) return
      hasHandledHighlightRef.current = true

      // Graceful Nostalgic Fallback: düğüm Neo4j'de zamanla silikleşti / unutuldu
      toast(
        t('mind.memory_faded', 'Bu anı zamanla silikleşti ve unutuldu.'),
        { icon: '🌫️', duration: 5000 }
      )
    }
  }, [highlightedActiveNodes, isLoading, highlightIds, focusNodeParam, t])

  const filteredNodes = useMemo(() => {
    if (!nodeSearch.trim()) return sortedNodes
    const q = nodeSearch.toLowerCase()
    return sortedNodes.filter(
      (n) =>
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.label && n.label.toLowerCase().includes(q)) ||
        (getNodeLabelText(n.label, n.isRoot, Boolean(tribeId)).toLowerCase().includes(q))
    )
  }, [sortedNodes, nodeSearch])

  // Drag sınırı — node'lar bu yarıçapı aşamaz
  const MAX_DRAG_DIST = 650
  const handleNodeDrag = useCallback((node) => {
    const dist = Math.sqrt((node.x || 0) ** 2 + (node.y || 0) ** 2 + (node.z || 0) ** 2)
    if (dist > MAX_DRAG_DIST) {
      const scale = MAX_DRAG_DIST / dist
      node.x = (node.x || 0) * scale
      node.y = (node.y || 0) * scale
      node.z = (node.z || 0) * scale
    }
  }, [])

  const handleNodeClick = useCallback((node) => {
    if (!node) return
    selectedNodeRef.current = node
    setSelectedNode(node)
    selectedLinkRef.current = null // Node seçildiğinde damar seçimini iptal et
  }, [])

  // Grafik yüklenince iç D3 node'larına Fibonacci küre pozisyonu ata
  // useEffect + setTimeout: ForceGraph3D'nin kendi iç veri yapısını hazırlamasını bekle
  useEffect(() => {
    if (graphData.nodes.length === 0) return
    const tid = setTimeout(() => {
      if (!fgRef.current) return
      const fg = fgRef.current

      // Kuvvetleri buradan da güvenli şekilde ayarla
      const lf = fg.d3Force('link')
      if (lf) {
        lf.distance((link) => {
          if (link.source?.label === 'Persona' || link.target?.label === 'Persona') return 260
          return 40 // Kılcal bağlar aşırı kısaltıldı
        }).strength(0.3)
      }
      const cf = fg.d3Force('charge')
      if (cf) cf.strength(-900)

      const internalNodes = fg.graphData().nodes
      if (!internalNodes || internalNodes.length === 0) return

      const nonPersona = internalNodes.filter((n) => n.label !== 'Persona')
      const total = nonPersona.length || 1

      // Persona merkez
      internalNodes.forEach((n) => {
        if (n.label === 'Persona') {
          n.x = 0
          n.y = 0
          n.z = 0
          n.vx = 0
          n.vy = 0
          n.vz = 0
        }
      })

      // Diğerleri Fibonacci küre üzerine — 200-280 birim mesafede
      nonPersona.forEach((n, i) => {
        const phi = Math.acos(-1 + (2 * i) / total)
        const theta = Math.sqrt(total * Math.PI) * phi
        const r = 200 + (i % 4) * 25
        n.x = r * Math.sin(phi) * Math.cos(theta)
        n.y = r * Math.sin(phi) * Math.sin(theta)
        n.z = r * Math.cos(phi)
        n.vx = 0
        n.vy = 0
        n.vz = 0
      })

      // Simülasyonu bu pozisyonlardan başlat
      fg.d3ReheatSimulation()
    }, 150)
    return () => clearTimeout(tid)
  }, [graphData.nodes.length])

  // Otomatik döndürme — mouse ile etkileşimde durur, 4sn sonra devam eder
  const userInteractingRef = useRef(false)
  const interactTimeoutRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const onInteract = () => {
      userInteractingRef.current = true
      clearTimeout(interactTimeoutRef.current)
      // 4 saniye hareketsizlik sonrası rotasyona dön
      interactTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false
      }, 4000)
    }

    const el = containerRef.current
    el.addEventListener('mousemove', onInteract)
    el.addEventListener('wheel', onInteract)
    el.addEventListener('mousedown', onInteract)
    el.addEventListener('touchstart', onInteract)

    return () => {
      el.removeEventListener('mousemove', onInteract)
      el.removeEventListener('wheel', onInteract)
      el.removeEventListener('mousedown', onInteract)
      el.removeEventListener('touchstart', onInteract)
      clearTimeout(interactTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return
    let angle = 0
    const id = setInterval(() => {
      // Bir düğüm veya bağlantı seçiliyken ya da kullanıcı etkileşim halindeyken rotasyonu durdur
      if (!fgRef.current || userInteractingRef.current || selectedNodeRef.current || selectedLinkRef.current) return
      
      const cam = fgRef.current.camera?.()
      if (cam) {
        angle = Math.atan2(cam.position.x, cam.position.z) + 0.002
      } else {
        angle += 0.002
      }
      fgRef.current.cameraPosition({ x: 600 * Math.sin(angle), z: 600 * Math.cos(angle) })
    }, 30)
    return () => clearInterval(id)
  }, [graphData.nodes.length])

  return (
    <>
      {/* Tam ekranı kaplayan nöron ağı overlay */}
      <div
        style={{
          position: 'fixed',
          top: TOPBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Header — PersonalityCardHierarchyPage tarzı yüzen (floating) pill çifti */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            flexShrink: 0,
            minHeight: 56,
          }}
        >
          {/* Sol: Geri + Kimlik bloğu */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 14px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              maxWidth: contextTitle ? '34%' : '55%',
              minWidth: 0,
            }}
          >
            <button
              onClick={() => navigate(-1)}
              title={t('common.back', 'Geri')}
              style={{
                width: 30,
                height: 30,
                padding: 0,
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--color-border)', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Brain size={18} color="var(--color-primary)" style={{ flexShrink: 0, display: 'block' }} />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('mind.graph_title', 'MIND GRAPH')}
              </span>
              <span style={{ color: 'var(--color-primary)', flexShrink: 0, transform: 'translateY(-1px)' }}>•</span>
              {rootName && (
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transform: 'translateY(1px)',
                    minWidth: 0,
                  }}
                >
                  {rootName}
                </span>
              )}
            </div>
          </div>

          {/* Orta: Tetiklenen Anıların Bağlantılı Olduğu Başlık (Sade, tırnak içinde, özel sarı bloksuz) */}
          {contextTitle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '42%',
                minWidth: 0,
                padding: '0 12px',
                textAlign: 'center',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
              title={contextTitle}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontStyle: 'italic',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                }}
              >
                "{contextTitle}"
              </span>
            </div>
          )}

          {/* Sağ: Node tanımları + Varsayılan Görünüm */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 12px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              flexShrink: 0,
              maxWidth: contextTitle ? '32%' : '100%',
            }}
          >
            {[
              { color: isGreenMode ? '#10b981' : '#3b82f6', label: tribeId ? t('mind.labels.tribe_root', 'Tribe (Root)') : t('mind.labels.persona', 'Persona') },
              { color: NEURON_COLORS.Tribe.core, label: tribeId ? t('mind.labels.other_tribes', 'Other Tribes') : t('mind.labels.tribe', 'Tribe') },
              { color: NEURON_COLORS.Actor.core, label: t('mind.labels.actor', 'Actor') },
              { color: NEURON_COLORS.GeneralThought.core, label: t('mind.labels.general_thought', 'Thought') },
            ].map(({ color, label }, idx) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {idx > 0 && <span style={{ width: 1, height: 18, background: 'var(--color-border)', marginRight: 2 }} />}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </span>
            ))}

            <span style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                selectedNodeRef.current = null
                setSelectedNode(null)
                selectedLinkRef.current = null
                if (fgRef.current) {
                  fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000)
                }
              }}
              title={t('hierarchy.default_view', 'Varsayılan görünüme dön')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: 32 }}
            >
              <Focus size={13} />
              <span>Default</span>
            </button>
          </div>
        </div>

        {/* Graph Alanı */}
        <div
          ref={containerRef}
          style={{ flex: 1, width: '100%', position: 'relative', background: bgColor }}
        >
          {isLoading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <Brain size={40} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
              <div className="spinner spinner-lg" />
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Brain size={40} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
              <p style={{ color: 'var(--color-primary)', opacity: 0.6, fontSize: 14 }}>
                {t('mind.no_memories', 'No memories found.')}
              </p>
            </div>
          ) : (
            dimensions.width > 0 &&
            dimensions.height > 0 && (
              <ForceGraph3D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                backgroundColor={bgColor}
                // Custom Three.js parlayan nöron objeleri
                nodeThreeObject={buildNeuronObject}
                nodeThreeObjectExtend={false}
                nodeLabel={() => ''}
                // 3D silindirik kılcal damar tüpleri
                linkThreeObject={buildCapillaryObject}
                linkPositionUpdate={updateCapillaryPosition}
                // Organik fizik + node arası mesafe
                d3VelocityDecay={0.3}
                d3AlphaDecay={0.02}
                warmupTicks={0}
                cooldownTicks={200}
                onEngineStop={() => {
                  if (isInitialZoomRef.current && fgRef.current) {
                    // zoomToFit çok uzağa attığı için sabit, daha yakın ve şık bir açı kullanıyoruz
                    fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000)
                    isInitialZoomRef.current = false
                  }
                }}
                onNodeDrag={handleNodeDrag}
                onNodeClick={handleNodeClick}
                onLinkHover={(link) => {
                  hoveredLinkRef.current = link
                }}
                onLinkClick={(link) => {
                  // Seçili olanı kaldır ya da yenisini seç
                  selectedLinkRef.current = selectedLinkRef.current === link ? null : link
                }}
              />
            )
          )}

          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              isTribeContext={Boolean(tribeId)}
              onClose={() => {
                selectedNodeRef.current = null
                setSelectedNode(null)
              }}
            />
          )}

          {/* Sağ Üst Kontrol & Düğüm Listesi */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 12,
              maxHeight: 'calc(100vh - 120px)',
              pointerEvents: 'none',
            }}
          >
            {/* Anılar Listesi Paneli (Sağ Üstte) */}
            {graphData.nodes.length > 0 && (
              <div
                style={{
                  pointerEvents: 'auto',
                  width: 280,
                  maxHeight: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: headerBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 16,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {/* Panel Başlığı */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderBottom: isNodeListCollapsed
                      ? 'none'
                      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Brain size={16} style={{ color: isGreenMode ? '#10b981' : '#3b82f6' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? '#f0e6ff' : '#111827' }}>
                      {t('mind.memories_title', 'Anılar')}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {graphData.nodes.length}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsNodeListCollapsed((prev) => !prev)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 6,
                      color: isDarkMode ? 'rgba(240,230,255,0.7)' : 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={isNodeListCollapsed ? t('common.expand', 'Genişlet') : t('common.collapse', 'Daralt')}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        display: 'inline-block',
                        transform: isNodeListCollapsed ? 'none' : 'rotate(180deg)',
                        transition: 'transform var(--transition-fast, 0.2s ease)',
                      }}
                    >
                      ▼
                    </span>
                  </button>
                </div>

                {/* Genişletilmiş Liste İçeriği */}
                {!isNodeListCollapsed && (
                  <>
                    {/* Arama Kutusu */}
                    {graphData.nodes.length > 5 && (
                      <div
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        }}
                      >
                        <Search size={14} style={{ color: isDarkMode ? 'rgba(240,230,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                        <input
                          type="text"
                          placeholder={t('mind.search_memories', 'Anı ara...')}
                          value={nodeSearch}
                          onChange={(e) => setNodeSearch(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: 12,
                            color: isDarkMode ? '#f0e6ff' : '#000000',
                          }}
                        />
                        {nodeSearch && (
                          <button
                            onClick={() => setNodeSearch('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 2,
                              color: isDarkMode ? 'rgba(240,230,255,0.6)' : 'rgba(0,0,0,0.5)',
                              display: 'flex',
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Anılar Listesi */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '6px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        maxHeight: 340,
                      }}
                    >
                      {filteredNodes.length === 0 ? (
                        <div
                          style={{
                            padding: '16px 8px',
                            textAlign: 'center',
                            fontSize: 12,
                            color: isDarkMode ? 'rgba(240,230,255,0.4)' : 'rgba(0,0,0,0.4)',
                          }}
                        >
                          {t('mind.no_memories_found', 'Eşleşen anı bulunamadı')}
                        </div>
                      ) : (
                        filteredNodes.map((node) => {
                          const isSelected = selectedNode?.id === node.id
                          const { core, glow } = getNeuronColor(node.label, node.isRoot)

                          return (
                            <div
                              key={node.id}
                              onClick={() => {
                                let targetNode = node
                                if (fgRef.current) {
                                  const scene = fgRef.current.scene()
                                  scene?.traverse((obj) => {
                                    if (obj.__data && obj.__data.id === node.id) {
                                      targetNode = obj.__data
                                    }
                                  })
                                }
                                handleNodeClick(targetNode)
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                background: isSelected
                                  ? isDarkMode
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'rgba(0,0,0,0.08)'
                                  : 'transparent',
                                border: isSelected ? `1px solid ${core}` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = isDarkMode
                                    ? 'rgba(255,255,255,0.06)'
                                    : 'rgba(0,0,0,0.04)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              {/* Nokta göstergesi */}
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: core,
                                  boxShadow: `0 0 6px ${glow}`,
                                  flexShrink: 0,
                                }}
                              />

                              {/* İsim ve Etiket */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isDarkMode ? '#f0e6ff' : '#111827',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={node.name}
                                >
                                  {node.name || t('mind.unknown_memory', 'Anı')}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 500,
                                    color: core,
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                    marginTop: 1,
                                  }}
                                >
                                  {getNodeLabelText(node.label, node.isRoot, Boolean(tribeId))}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: '60vh' }} />
    </>
  )
}
