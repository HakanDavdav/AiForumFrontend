import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'
import { ArrowLeft, Loader2, Brain, Focus } from 'lucide-react'
import toast from 'react-hot-toast'

// Nöron renk paleti — koyu arka planda biyolüminesans tonlar
const NEURON_COLORS = {
  Persona: { core: '#ff6b35', glow: '#ff4500' },
  Topic: { core: '#00e5ff', glow: '#00bcd4' },
  default: { core: '#c084fc', glow: '#a855f7' },
}

function getNeuronColor(label) {
  return NEURON_COLORS[label] || NEURON_COLORS.default
}

// Three.js ile parlayan küre nesnesi oluştur (3 katman: çekirdek + orta hale + dış hale)
function buildNeuronObject(node) {
  const isPersona = node.label === 'Persona'
  const { core, glow } = getNeuronColor(node.label)
  const group = new THREE.Group()

  // Yarıçap: ForceGraph3D link offset'iyle eşleşecek boyutta
  // nodeRelSize=6, val=30 → ~18.7, val=10 → ~12.9
  const r = isPersona ? 30 : (node.label === 'Topic' ? 14 : 8)

  // İç parlak çekirdek
  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 24),
      new THREE.MeshBasicMaterial({ color: core })
    )
  )
  // Orta hale
  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.45, 18, 18),
      new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.2 })
    )
  )
  // Dış yumuşak hale
  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(r * 2.1, 12, 12),
      new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.07 })
    )
  )

  let titleText = node.name || node.label
  if (titleText.length > 18) {
    titleText = titleText.substring(0, 18) + '...'
  }
  const subtitleText = node.label

  // Yazıların genişliğini önceden ölç
  const tempCtx = document.createElement('canvas').getContext('2d')
  tempCtx.font = 'bold 72px Inter, sans-serif'
  const titleWidth = tempCtx.measureText(titleText).width
  tempCtx.font = 'bold 56px Inter, sans-serif'
  const subtitleWidth = tempCtx.measureText(subtitleText).width
  const maxTextWidth = Math.max(titleWidth, subtitleWidth)

  // Kutunun genişliğini yazıya göre dinamik ayarla (minimum 900px, yazı çok uzunsa daha geniş)
  const rectWidth = Math.max(900, maxTextWidth + 180)
  const canvasWidth = rectWidth + 100 // X=50 boşlukları için (sağ ve sol)
  const canvasHeight = 420

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  // Kutucuğun arka planını eski hafif şeffaf, koyu mor/lacivert cam formuna döndürüyoruz
  ctx.fillStyle = 'rgba(10, 5, 20, 0.85)'
  ctx.beginPath()
  ctx.roundRect(50, 40, rectWidth, 340, 50)
  ctx.fill()
  ctx.strokeStyle = core
  ctx.lineWidth = 12
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const centerX = canvasWidth / 2

  ctx.font = 'bold 72px Inter, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(titleText, centerX, 155)

  ctx.font = 'bold 56px Inter, sans-serif'
  ctx.fillStyle = glow
  ctx.fillText(subtitleText, centerX, 260)

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const badgeMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  // Dinamik orantı: Canvas genişliğine göre Mesh'in X genişliğini uzatıyoruz
  // Persona node'u çok büyük olduğu için kutucuğu devasa yapmamak adına boyut çarpanını kısıtlıyoruz
  const scaleR = isPersona ? 20 : r
  const scaleX = (canvasWidth / 1000) * (scaleR * 12.0)
  const scaleY = scaleR * 4.2

  const badgeGeo = new THREE.PlaneGeometry(scaleX, scaleY)
  const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat)

  // Gerçek r'ye göre yüksekliği ayarla ki kürenin içine girmesin ama çok da uçmasın
  const heightMultiplier = isPersona ? 2.5 : 5.0
  badgeMesh.position.set(0, r * heightMultiplier, 0)
  badgeMesh.renderOrder = 9999999
  badgeMesh.userData = { isBadge: true }

  // Mesh'in her zaman kameraya bakmasını sağla
  badgeMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }

  group.add(badgeMesh)

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

// Global shader uniforms
const globalUniforms = {
  uTime: { value: 0 },
  uPulseColor: { value: new THREE.Vector3(1.0, 0.05, 0.05) },
}

// Shader enjeksiyonu: Kan nabzı efekti (kalp atışı ritmi)
const injectPulseShader = (shader) => {
  shader.uniforms.uTime = globalUniforms.uTime
  shader.uniforms.uPulseColor = globalUniforms.uPulseColor

  // vertexShader: uv koordinatlarını varying olarak frag shader'a gönder
  shader.vertexShader = `
    varying vec2 vUvPulse;
    ${shader.vertexShader}
  `.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
     vUvPulse = uv;`
  )

  // fragmentShader: emissive rengine dalga fonksiyonu ekle
  shader.fragmentShader = `
    uniform float uTime;
    uniform vec3 uPulseColor;
    varying vec2 vUvPulse;
    ${shader.fragmentShader}
  `.replace(
    `vec3 totalEmissiveRadiance = emissive;`,
    `
    // vUvPulse.x tüp boyunca (start -> end) ilerler
    // Hız ve dalga yoğunluğu
    float speed = 1.2;
    float phase = uTime * speed - vUvPulse.x * 4.0;
    
    // Kalp atışı (çift vuruş) efekti
    float beat = fract(phase);
    float pulse = exp(-18.0 * beat) + 0.6 * exp(-18.0 * fract(beat + 0.15));
    
    // Parlak kan kırmızısı ışıma
    vec3 pulseColor = uPulseColor * pulse * 2.8;
    vec3 totalEmissiveRadiance = emissive + pulseColor;
    `
  )
}

// Global materyaller (performans için)
const _vesselMat = new THREE.MeshPhongMaterial({
  color: '#b30000',
  emissive: '#3d0000',
  shininess: 70,
  opacity: 1.0,
  transparent: false, // Damarlar OPAQUE pass'te çizilecek! Böylece Transparent pass'teki panolar her halükarda onların üzerine çizecek.
})
_vesselMat.onBeforeCompile = injectPulseShader

const _branchMat = new THREE.MeshPhongMaterial({
  color: '#990000',
  emissive: '#2b0000',
  shininess: 50,
  opacity: 0.85,
  transparent: true,
})
_branchMat.onBeforeCompile = injectPulseShader

const linkLabelCache = new Map()

function buildCapillaryObject(link) {
  const g = new THREE.Group()
  g.userData._built = false

  if (link && link.name) {
    if (!linkLabelCache.has(link.name)) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.font = 'bold 36px Inter, sans-serif'
      const textWidth = ctx.measureText(link.name).width

      const rectWidth = Math.max(160, textWidth + 80)
      canvas.width = rectWidth + 20
      canvas.height = 80

      ctx.fillStyle = 'rgba(20, 0, 5, 0.85)'
      ctx.beginPath()
      ctx.roundRect(10, 10, rectWidth, 60, 15)
      ctx.fill()
      ctx.strokeStyle = '#b30000'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 36px Inter, sans-serif'
      ctx.fillStyle = '#ffb3b3'
      ctx.fillText(link.name, canvas.width / 2, 40)

      const tex = new THREE.CanvasTexture(canvas)
      tex.minFilter = THREE.LinearFilter

      const labelMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })

      const scaleX = (canvas.width / 400) * 40
      linkLabelCache.set(link.name, { mat: labelMat, width: scaleX })
    }

    const { mat, width } = linkLabelCache.get(link.name)
    const baseScale = 1.6 // Etiketleri default olarak çok daha büyük yaptık
    const labelGeo = new THREE.PlaneGeometry(width * baseScale, 8 * baseScale)
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

// Organik dal oluşturucu — recursif çağrılabilir
function addVesselBranch(obj, mat, rng, startPt, direction, length, radius, depth, perp1, perp2) {
  if (depth === 0 || length < 4 || radius < 0.25) return

  const pts = [startPt.clone()]
  const segments = 4 + Math.floor(rng() * 3) // 4–6 segment
  for (let s = 1; s <= segments; s++) {
    const t = s / segments
    const base = startPt.clone().addScaledVector(direction, length * t)

    // Eğer ana damar hedefe ulaşıyorsa sapma ekleme, tam hedef node'a (uca) kilitlensin!
    // Bu sayede damar ucu boşlukta kalmaz, fiziksel olarak diğer node'a bağlanır.
    if (s < segments) {
      const warpMag = length * (0.28 + rng() * 0.18)
      base
        .addScaledVector(perp1, (rng() - 0.5) * warpMag)
        .addScaledVector(perp2, (rng() - 0.5) * warpMag)
        .addScaledVector(direction, (rng() - 0.5) * length * 0.08) // boyunca da hafif zikzak
    }
    pts.push(base)
  }

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.7)
  const tubeSegs = Math.max(8, Math.floor(segments * 5))
  const geo = new THREE.TubeGeometry(curve, tubeSegs, radius, 6, false)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = -999 // Damarları her zaman arkaya it (ilk çizilsinler)
  obj.add(mesh)

  // Bu dal üzerinde 1–3 alt dal oluştur
  const childCount = depth === 1 ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 2)
  for (let i = 0; i < childCount; i++) {
    const t = 0.2 + rng() * 0.65 // dallanma noktası
    const bStart = curve.getPoint(t)
    const mainTangent = curve.getTangent(t).normalize()

    // Tamamen rastgele bir dik yön — geometrik değil
    const randVec = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize()
    const bDir = new THREE.Vector3()
      .crossVectors(mainTangent, randVec)
      .normalize()
      .addScaledVector(randVec, 0.35 + rng() * 0.4) // biraz rastgele bileşen ekle
      .normalize()

    const bLen = length * (0.35 + rng() * 0.35) // %35–%70 uzunluk
    const bRadius = radius * (0.42 + rng() * 0.18) // incelme

    // Alt dalın kendi dik vektörleri
    const bUp = Math.abs(bDir.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const bPerp1 = new THREE.Vector3().crossVectors(bDir, bUp).normalize()
    const bPerp2 = new THREE.Vector3().crossVectors(bDir, bPerp1).normalize()

    addVesselBranch(obj, mat, rng, bStart, bDir, bLen, bRadius, depth - 1, bPerp1, bPerp2)
  }
}

function updateCapillaryPosition(obj, { start, end }, link) {
  const sv = new THREE.Vector3(start.x, start.y, start.z)
  const ev = new THREE.Vector3(end.x, end.y, end.z)
  const dir = ev.clone().sub(sv).normalize()
  const len = sv.distanceTo(ev)
  if (len < 1) return true

  // Pozisyon cache — gereksiz yeniden çizimi önle
  const posKey = `${start.x.toFixed(0)},${start.y.toFixed(0)},${end.x.toFixed(0)},${end.y.toFixed(0)}`
  if (obj.userData._posKey === posKey) return true
  obj.userData._posKey = posKey

  // Önceki geometrileri temizle, ancak isim etiketini koru ve pozisyonunu güncelle
  const toRemove = []
  obj.children.forEach((c) => {
    if (c.userData && c.userData.isLinkLabel) {
      const midPoint = new THREE.Vector3().addVectors(sv, ev).multiplyScalar(0.5)
      midPoint.y += 4 // Etiket damarın hafif üzerinde yüzsün
      c.position.copy(midPoint)
    } else {
      c.geometry?.dispose()
      toRemove.push(c)
    }
  })
  toRemove.forEach((c) => obj.remove(c))

  const linkId =
    typeof link.source === 'object'
      ? `${link.source.id ?? ''}-${link.target?.id ?? ''}`
      : `${link.source}-${link.target}`
  const rng = makeRng(strHash(linkId))

  // Ana dik eksenler
  const up = Math.abs(dir.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const perp1 = new THREE.Vector3().crossVectors(dir, up).normalize()
  const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize()

  // Ana damar kalınlığı
  const mainRadius = 2.2 + rng() * 1.0 // 2.2 – 3.2

  // Ana damarı recursif fonksiyonla çiz, depth=2 → 2 seviye dallanma
  addVesselBranch(obj, _vesselMat, rng, sv, dir, len, mainRadius, 2, perp1, perp2)

  return true
}

// TopBar yüksekliği — CSS değişkeninden okunuyor
const TOPBAR_HEIGHT = 'var(--topbar-height)'

function NodeDetailPanel({ node, onClose }) {
  const { isDarkMode } = useThemeStore()
  const { core, glow } = getNeuronColor(node.label)
  const icon = node.label === 'Persona' ? '🧠' : node.label === 'Topic' ? '📌' : '💠'

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
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            {icon}
          </div>
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
              {node.name || 'Unknown Node'}
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

      <div
        style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, rgba(192,132,252,0.3) 0%, transparent 100%)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(node).map(([key, value]) => {
          // Grafik içi gereksiz 3D koordinat bilgilerini filtrele
          if (
            ['id', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'index', 'name', 'label', 'val', 'color', '__indexColor', '__threeObj'].includes(key) ||
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
                {key === 'lastUpdated' ? 'Son Güncelleme' : key}
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
  const [searchParams] = useSearchParams()
  const actorId = searchParams.get('actorId')
  const tribeId = searchParams.get('tribeId')
  const navigate = useNavigate()
  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)

  const bgColor = isDarkMode ? '#09090b' : '#ffffff'
  const headerBg = isDarkMode ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)'
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
  
  const btnColor = isGreenMode ? '#10b981' : '#3b82f6'
  const btnBg = isGreenMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)'
  const btnBgHover = isGreenMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'
  const btnBorder = isGreenMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'

  useEffect(() => {
    if (isGreenMode) {
      _vesselMat.color.set('#059669')
      _vesselMat.emissive.set('#022c22')
      _branchMat.color.set('#10b981')
      _branchMat.emissive.set('#064e3b')
      globalUniforms.uPulseColor.value.set(0.05, 1.0, 0.2)
    } else {
      _vesselMat.color.set('#2563eb')
      _vesselMat.emissive.set('#1e3a8a')
      _branchMat.color.set('#3b82f6')
      _branchMat.emissive.set('#1e40af')
      globalUniforms.uPulseColor.value.set(0.05, 0.5, 1.0)
    }
  }, [isGreenMode])

  const [isLoading, setIsLoading] = useState(true)
  const [rawData, setRawData] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)

  const fgRef = useRef()
  const containerRef = useRef()
  const isInitialZoomRef = useRef(true)
  const hoveredLinkRef = useRef(null)
  const selectedLinkRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Shader'lar için global zaman sayacı ve etiket animasyonları
  useEffect(() => {
    let frameId
    const startTime = Date.now()
    const updateTime = () => {
      globalUniforms.uTime.value = (Date.now() - startTime) / 1000

      // Damar etiketleri için pürüzsüz büyüme/küçülme (smooth lerp) animasyonu
      if (fgRef.current) {
        const scene = fgRef.current.scene()
        scene.traverse((obj) => {
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
      toast.error('Actor or Tribe ID is missing.')
      navigate('/')
      return
    }

    const fetchMemory = async () => {
      setIsLoading(true)
      try {
        const response = actorId 
          ? await actorApi.getFullMemory(actorId)
          : await tribeApi.getFullMemory(tribeId)
        
        if (response.data.succeeded) {
          if (response.data.data) {
            try {
              const parsedData = JSON.parse(response.data.data)
              setRawData(parsedData)
            } catch (e) {
              console.error('Failed to parse neo4j output:', e)
              toast.error('Failed to parse memory data.')
              setRawData([])
            }
          } else {
            setRawData([])
          }
        } else {
          toast.error(response.data.errors?.[0]?.description || 'Failed to fetch memory.')
        }
      } catch (error) {
        console.error(error)
        toast.error('An error occurred while fetching memory.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemory()
  }, [actorId, navigate])

  const graphData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return { nodes: [], links: [] }

    const nodesMap = new Map()
    const linksSet = new Set()
    const linksArr = []

    rawData.forEach((path) => {
      const pathNodes = path.Nodes || []
      const pathRels = path.Relationships || []

      // Add nodes
      pathNodes.forEach((n) => {
        const nodeId = n.id || n.name || JSON.stringify(n)
        if (!nodesMap.has(nodeId)) {
          const isPersona = n.label === 'Persona'
          const { core } = getNeuronColor(n.label)
          nodesMap.set(nodeId, {
            ...n,
            id: nodeId,
            name: n.name || nodeId,
            label: n.label,
            val: isPersona ? 200 : 10,
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
          const relType = pathRels[i]

          const linkKey = `${sourceId}-${relType}-${targetId}`
          if (!linksSet.has(linkKey)) {
            linksSet.add(linkKey)
            linksArr.push({
              source: sourceId,
              target: targetId,
              name: relType,
            })
          }
        }
      }
    })

    const nodes = Array.from(nodesMap.values())
    const nonPersona = nodes.filter((n) => n.label !== 'Persona')
    const total = nonPersona.length || 1

    // Persona merkeze, diğerleri Fibonacci küre üzerine dağıt
    nodes.forEach((node) => {
      if (node.label === 'Persona') {
        node.x = 0
        node.y = 0
        node.z = 0
      }
    })
    nonPersona.forEach((node, i) => {
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
  }, [rawData])

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
    setSelectedNode(node)
    selectedLinkRef.current = null // Node seçildiğinde damar seçimini iptal et
    const r = node.label === 'Persona' ? 30 : (node.label === 'Topic' ? 14 : 8)
    const distance = r * 1.1

    if (fgRef.current) {
      if (node.x === 0 && node.y === 0 && node.z === 0) {
        fgRef.current.cameraPosition({ x: 0, y: 0, z: distance }, node, 1000)
      } else {
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z)
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          1000
        )
      }
    }
  }, [])

  // Panel açıkken (bir node seçiliyken) arkadaki tüm 3D isim kutucuklarını ve damar bağlantı yazılarını gizle
  useEffect(() => {
    if (!fgRef.current) return
    const scene = fgRef.current.scene()
    scene.traverse((obj) => {
      if (obj.userData && (obj.userData.isBadge || obj.userData.isLinkLabel)) {
        obj.visible = !selectedNode
      }
    })
  }, [selectedNode])

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
      if (!fgRef.current || userInteractingRef.current) return
      angle += 0.002
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
        {/* Header — glassmorphism */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            background: headerBg,
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
            height: 56,
          }}
        >
          {/* Sol: geri + başlık */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: 8,
                borderRadius: '50%',
                border: btnBorder,
                background: btnBg,
                cursor: 'pointer',
                color: btnColor,
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = btnBgHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = btnBg
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={20} style={{ color: isGreenMode ? '#10b981' : '#3b82f6' }} />
              <div>
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isGreenMode ? '#10b981' : '#3b82f6',
                    margin: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  MIND GRAPH
                </h1>

              </div>
            </div>
          </div>
          {/* Sağ: renk legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {[
              { color: '#ff6b35', label: 'Persona' },
              { color: '#00e5ff', label: 'Topic' },
              { color: '#c084fc', label: 'Entity' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
                <span
                  style={{ fontSize: 11, color: isDarkMode ? 'rgba(240,230,255,0.5)' : 'rgba(0,0,0,0.6)', letterSpacing: '0.04em' }}
                >
                  {label}
                </span>
              </div>
            ))}
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
              <Brain size={40} style={{ color: '#c084fc', opacity: 0.7 }} />
              <Loader2 size={28} className="animate-spin" style={{ color: '#c084fc' }} />
              <span
                style={{ fontSize: 13, color: 'rgba(192,132,252,0.5)', letterSpacing: '0.05em' }}
              >
                Syncing neural pathways...
              </span>
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
                No neural pathways found for this persona.
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
              onClose={() => {
                if (fgRef.current && selectedNode) {
                  const distance = 250 // Tüm grafiğe (çok uzağa) gitmek yerine sadece nodun biraz dışına çık
                  if (selectedNode.x === 0 && selectedNode.y === 0 && selectedNode.z === 0) {
                    fgRef.current.cameraPosition({ x: 0, y: 0, z: distance }, selectedNode, 800)
                  } else {
                    const distRatio =
                      1 + distance / Math.hypot(selectedNode.x, selectedNode.y, selectedNode.z)
                    fgRef.current.cameraPosition(
                      {
                        x: selectedNode.x * distRatio,
                        y: selectedNode.y * distRatio,
                        z: selectedNode.z * distRatio,
                      },
                      selectedNode,
                      800
                    )
                  }
                }
                setSelectedNode(null)
              }}
            />
          )}

          {/* Reset View Butonu */}
          <button
            onClick={() => {
              setSelectedNode(null);
              if (fgRef.current) {
                // Tıpkı ilk açılıştaki gibi sabit, yakın bir açıya dön
                fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
              }
            }}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              padding: '10px 18px',
              background: headerBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              color: isDarkMode ? '#f0e6ff' : '#000000',
              cursor: 'pointer',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = isDarkMode ? 'color-mix(in srgb, var(--color-primary) 60%, transparent)' : 'rgba(0, 0, 0, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = headerBg;
              e.currentTarget.style.borderColor = borderColor;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Focus size={18} style={{ color: 'var(--color-primary)' }} />
            Varsayılan Görünüm
          </button>
        </div>
      </div>
      <div style={{ height: '60vh' }} />
    </>
  )
}
