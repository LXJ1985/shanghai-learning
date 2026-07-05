import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag, Card } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  BookOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Types ───────── */

interface PoemDef {
  key: string
  name: string
  dynasty: string
  author: string
  title: string
  lines: string[]
  description: string
  params: ParamDef[]
}

interface ParamDef {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
  unit: string
}

/* ───────── Drawing Helpers ───────── */

function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return { ctx, w: rect.width, h: rect.height }
}

function drawInkBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#FDFBF7')
  grad.addColorStop(1, '#F5F0E8')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  // Subtle paper texture dots
  ctx.fillStyle = 'rgba(180,170,155,0.06)'
  for (let i = 0; i < 200; i++) {
    const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * w
    const y = (Math.cos(i * 311.7) * 0.5 + 0.5) * h
    ctx.beginPath()
    ctx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, size = 28) {
  ctx.save()
  ctx.strokeStyle = '#C45D3E'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, size, size)
  ctx.fillStyle = '#C45D3E'
  ctx.font = `bold ${size * 0.55}px "KaiTi", "STKaiti", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + size / 2, y + size / 2)
  ctx.restore()
}

/* ───────── 1. Writing Animation (诗词书写) ───────── */

function drawWriting(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const speed = params.speed || 1
  const charSize = params.charSize || 48
  const progress = Math.min(t * 0.3 * speed, 1)

  drawInkBackground(ctx, w, h)

  const poem = poems[0]
  const allChars = poem.lines.join('')
  const totalChars = allChars.length
  const visibleChars = Math.floor(progress * totalChars)

  // Title area
  ctx.fillStyle = '#2C2824'
  ctx.font = `bold ${charSize * 0.7}px "KaiTi", "STKaiti", serif`
  ctx.textAlign = 'center'
  ctx.fillText(poem.title, w / 2, 50)

  ctx.fillStyle = '#8C8580'
  ctx.font = `${charSize * 0.35}px "KaiTi", "STKaiti", serif`
  ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, 78)

  // Draw characters in vertical columns (right to left)
  const cols = Math.ceil(totalChars / 6)
  const colWidth = charSize * 1.2
  const startX = w - 60
  const startY = 110
  const lineH = charSize * 1.1

  let charIdx = 0
  for (let col = 0; col < cols; col++) {
    const x = startX - col * colWidth
    for (let row = 0; row < 6 && charIdx < totalChars; row++) {
      const char = allChars[charIdx]
      const charProgress = Math.max(0, Math.min(1, (progress * totalChars - charIdx) * 3))

      if (charProgress > 0) {
        // Ink fade-in effect
        ctx.globalAlpha = charProgress
        ctx.fillStyle = '#2C2824'
        ctx.font = `${charSize}px "KaiTi", "STKaiti", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(char, x, startY + row * lineH)

        // Brush stroke animation - underline for current char
        if (charProgress < 1) {
          ctx.strokeStyle = '#C45D3E'
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.6
          const underlineW = charSize * charProgress
          ctx.beginPath()
          ctx.moveTo(x - charSize / 2, startY + row * lineH + charSize + 4)
          ctx.lineTo(x - charSize / 2 + underlineW, startY + row * lineH + charSize + 4)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      charIdx++
    }
  }

  // Seal stamp appears at end
  if (progress > 0.9) {
    const sealAlpha = Math.min((progress - 0.9) * 10, 1)
    ctx.globalAlpha = sealAlpha
    drawSeal(ctx, w - 80, h - 60, '诗')
    ctx.globalAlpha = 1
  }

  // Progress indicator
  ctx.fillStyle = '#8C8580'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`书写进度: ${(progress * 100).toFixed(0)}%`, 16, h - 16)
}

/* ──────── 2. Scene Animation (意境场景) ───────── */

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const sceneType = Math.round(params.sceneType || 0) // 0=静夜思, 1=春晓, 2=登鹳雀楼, 3=江雪

  // Background
  const scenes = [
    { sky: ['#0C1445', '#1A237E', '#283593'], ground: '#1A1A2E' },  // Night
    { sky: ['#E8F5E9', '#C8E6C9', '#A5D6A7'], ground: '#4CAF50' },   // Spring
    { sky: ['#FFF3E0', '#FFE0B2', '#FFCC80'], ground: '#E65100' },   // Sunset
    { sky: ['#ECEFF1', '#CFD8DC', '#B0BEC5'], ground: '#FFFFFF' },   // Snow
  ]
  const scene = scenes[sceneType]

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7)
  skyGrad.addColorStop(0, scene.sky[0])
  skyGrad.addColorStop(0.5, scene.sky[1])
  skyGrad.addColorStop(1, scene.sky[2])
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h * 0.7)
  ctx.fillStyle = scene.ground
  ctx.fillRect(0, h * 0.7, w, h * 0.3)

  const poem = poems[sceneType]

  // Scene-specific elements
  if (sceneType === 0) {
    // Moon
    const moonX = w * 0.75
    const moonY = h * 0.2
    const moonR = 40
    ctx.fillStyle = '#FFF9C4'
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = scene.sky[0]
    ctx.beginPath(); ctx.arc(moonX + 12, moonY - 5, moonR * 0.85, 0, Math.PI * 2); ctx.fill()

    // Stars
    ctx.fillStyle = '#FFF'
    for (let i = 0; i < 30; i++) {
      const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w
      const sy = (Math.cos(i * 269.5 + 183.3) * 0.5 + 0.5) * h * 0.5
      const twinkle = Math.sin(t * 2 + i) * 0.3 + 0.7
      ctx.globalAlpha = twinkle * 0.8
      ctx.beginPath(); ctx.arc(sx, sy, Math.random() * 1.5 + 0.5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1

    // Frost on ground
    ctx.fillStyle = 'rgba(200,210,230,0.3)'
    ctx.fillRect(0, h * 0.7, w, h * 0.05)
  } else if (sceneType === 1) {
    // Sun rising
    const sunY = h * 0.35 - Math.sin(t * 0.5) * 10
    ctx.fillStyle = '#FF8A65'
    ctx.beginPath(); ctx.arc(w * 0.8, sunY, 35, 0, Math.PI * 2); ctx.fill()

    // Birds
    for (let i = 0; i < 5; i++) {
      const bx = ((t * 30 + i * 120) % (w + 100)) - 50
      const by = h * 0.15 + Math.sin(t * 3 + i * 2) * 15 + i * 20
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bx - 8, by + 3)
      ctx.quadraticCurveTo(bx - 3, by - 3, bx, by)
      ctx.quadraticCurveTo(bx + 3, by - 3, bx + 8, by + 3)
      ctx.stroke()
    }

    // Flowers
    for (let i = 0; i < 8; i++) {
      const fx = 60 + i * (w - 120) / 7
      const fy = h * 0.72
      const colors = ['#E91E63', '#FF5722', '#FF9800', '#FFEB3B']
      ctx.fillStyle = colors[i % colors.length]
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2 + t * 0.5
        ctx.beginPath()
        ctx.arc(fx + Math.cos(angle) * 6, fy + Math.sin(angle) * 6, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(fx - 1, fy + 6, 2, 15)
    }
  } else if (sceneType === 2) {
    // Mountains
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.7)
    ctx.lineTo(w * 0.15, h * 0.35)
    ctx.lineTo(w * 0.3, h * 0.5)
    ctx.lineTo(w * 0.5, h * 0.2)
    ctx.lineTo(w * 0.7, h * 0.45)
    ctx.lineTo(w * 0.85, h * 0.3)
    ctx.lineTo(w, h * 0.5)
    ctx.lineTo(w, h * 0.7)
    ctx.fill()

    // River
    ctx.fillStyle = '#FF8F00'
    ctx.fillRect(0, h * 0.68, w, h * 0.04)

    // Sun setting
    const sunY = h * 0.25 + Math.sin(t * 0.3) * 5
    ctx.fillStyle = '#FF6D00'
    ctx.beginPath(); ctx.arc(w * 0.5, sunY, 30, 0, Math.PI * 2); ctx.fill()

    // Tower silhouette
    ctx.fillStyle = '#3E2723'
    const tx = w * 0.5
    ctx.fillRect(tx - 15, h * 0.4, 30, h * 0.3)
    ctx.fillRect(tx - 25, h * 0.38, 50, 8)
    ctx.fillRect(tx - 20, h * 0.33, 40, 8)
  } else {
    // Snow scene
    for (let i = 0; i < 50; i++) {
      const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w
      const sy = ((t * 20 + i * 37) % h)
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.beginPath(); ctx.arc(sx, sy, Math.random() * 2 + 1, 0, Math.PI * 2); ctx.fill()
    }

    // Mountain silhouette
    ctx.fillStyle = '#78909C'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.7)
    ctx.lineTo(w * 0.3, h * 0.3)
    ctx.lineTo(w * 0.6, h * 0.5)
    ctx.lineTo(w * 0.8, h * 0.25)
    ctx.lineTo(w, h * 0.45)
    ctx.lineTo(w, h * 0.7)
    ctx.fill()

    // Lone boat
    const boatX = w * 0.5 + Math.sin(t * 0.8) * 20
    const boatY = h * 0.72
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.moveTo(boatX - 20, boatY)
    ctx.lineTo(boatX + 20, boatY)
    ctx.lineTo(boatX + 15, boatY + 8)
    ctx.lineTo(boatX - 15, boatY + 8)
    ctx.fill()
    // Fisherman
    ctx.fillStyle = '#3E2723'
    ctx.fillRect(boatX - 3, boatY - 15, 6, 15)
    ctx.beginPath(); ctx.arc(boatX, boatY - 18, 4, 0, Math.PI * 2); ctx.fill()
  }

  // Poem text overlay
  ctx.fillStyle = sceneType === 3 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)'
  ctx.font = 'bold 22px "KaiTi", "STKaiti", serif'
  ctx.textAlign = 'center'
  ctx.fillText(poem.title, w / 2, h - 60)
  ctx.font = '14px "KaiTi", "STKaiti", serif'
  ctx.fillText(`${poem.dynasty} · ${poem.author}`, w / 2, h - 38)

  // Scene label
  const sceneNames = ['静夜思 · 月夜思乡', '春晓 · 春日清晨', '登鹳雀楼 · 登高望远', '江雪 · 寒江独钓']
  ctx.fillStyle = sceneType === 3 ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(sceneNames[sceneType], 16, 24)
}

/* ───────── 3. Meter Pattern (格律平仄) ───────── */

function drawMeter(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawInkBackground(ctx, w, h)

  const poem = poems[0] // 静夜思
  const lines = poem.lines
  const highlightLine = Math.round(params.highlightLine || 0)

  const startY = 60
  const lineH = 70
  const charW = 50
  const startX = (w - lines[0].length * charW) / 2

  // Title
  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 28px "KaiTi", "STKaiti", serif'
  ctx.textAlign = 'center'
  ctx.fillText(poem.title, w / 2, 35)

  // Draw each line
  lines.forEach((line, li) => {
    const y = startY + li * lineH
    const isHighlight = li === highlightLine
    const alpha = isHighlight ? 1 : 0.5

    // Background highlight
    if (isHighlight) {
      ctx.fillStyle = 'rgba(196,93,62,0.08)'
      ctx.fillRect(startX - 10, y - 25, line.length * charW + 20, lineH - 10)
    }

    // Characters
    for (let ci = 0; ci < line.length; ci++) {
      const x = startX + ci * charW
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#2C2824'
      ctx.font = `${isHighlight ? 'bold ' : ''}26px "KaiTi", "STKaiti", serif`
      ctx.textAlign = 'center'
      ctx.fillText(line[ci], x, y)

      // Tone marks below
      const tones = ['平', '仄', '平', '仄', '平'] // Simplified pattern
      const tone = tones[ci % tones.length]
      const isPing = tone === '平'

      ctx.globalAlpha = alpha * 0.8
      ctx.fillStyle = isPing ? '#4A7C59' : '#C45D3E'
      ctx.font = '12px sans-serif'
      ctx.fillText(tone, x, y + 22)

      // Animated underline for highlighted line
      if (isHighlight) {
        const waveOffset = Math.sin(t * 3 + ci * 0.5) * 2
        ctx.strokeStyle = isPing ? '#4A7C59' : '#C45D3E'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.moveTo(x - 15, y + 32 + waveOffset)
        ctx.lineTo(x + 15, y + 32 + waveOffset)
        ctx.stroke()
      }
    }
  })
  ctx.globalAlpha = 1

  // Legend
  const legendY = startY + lines.length * lineH + 20
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'left'

  ctx.fillStyle = '#4A7C59'
  ctx.fillRect(w / 2 - 80, legendY, 14, 14)
  ctx.fillStyle = '#6B6560'
  ctx.fillText('平声 (阴平/阳平)', w / 2 - 60, legendY + 12)

  ctx.fillStyle = '#C45D3E'
  ctx.fillRect(w / 2 + 60, legendY, 14, 14)
  ctx.fillStyle = '#6B6560'
  ctx.fillText('仄声 (上声/去声/入声)', w / 2 + 80, legendY + 12)

  // Info
  ctx.fillStyle = '#8C8580'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('五言绝句 · 仄起首句不入韵', 16, h - 16)
}

/* ───────── 4. Flying Flower (飞花令) ───────── */

interface FallingChar {
  char: string
  x: number
  y: number
  speed: number
  rotation: number
  rotSpeed: number
  size: number
  opacity: number
}

let fallingChars: FallingChar[] = []
let lastSpawnTime = 0

function drawFlyingFlower(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const speed = params.ffSpeed || 1
  const keyword = params.ffKeyword || 0 // 0=月, 1=花, 2=春, 3=风

  drawInkBackground(ctx, w, h)

  const keywords = ['月', '花', '春', '风']
  const kw = keywords[keyword]

  // Poem lines containing the keyword
  const allPoemLines = poems.flatMap((p, pi) =>
    p.lines.filter(l => l.includes(kw)).map(l => ({ line: l, poem: p.title, idx: pi }))
  )

  // Spawn new characters
  const spawnInterval = 800 / speed
  if (t * 1000 - lastSpawnTime > spawnInterval && allPoemLines.length > 0) {
    const entry = allPoemLines[Math.floor(Math.random() * allPoemLines.length)]
    const charIdx = entry.line.indexOf(kw)
    fallingChars.push({
      char: kw,
      x: Math.random() * (w - 60) + 30,
      y: -30,
      speed: (30 + Math.random() * 40) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      size: 28 + Math.random() * 20,
      opacity: 0.7 + Math.random() * 0.3,
    })
    lastSpawnTime = t * 1000
  }

  // Update and draw falling characters
  const dt = 1 / 60
  fallingChars = fallingChars.filter(c => c.y < h + 50)
  fallingChars.forEach(c => {
    c.y += c.speed * dt
    c.rotation += c.rotSpeed * dt

    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(c.rotation)
    ctx.globalAlpha = c.opacity
    ctx.fillStyle = '#C45D3E'
    ctx.font = `bold ${c.size}px "KaiTi", "STKaiti", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.char, 0, 0)
    ctx.restore()
  })
  ctx.globalAlpha = 1

  // Center display - current poem
  const currentPoem = poems[keyword]
  const boxW = Math.min(400, w - 40)
  const boxH = 160
  const boxX = (w - boxW) / 2
  const boxY = h - boxH - 20

  ctx.fillStyle = 'rgba(253,251,247,0.92)'
  ctx.strokeStyle = '#D0C8BE'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 18px "KaiTi", "STKaiti", serif'
  ctx.textAlign = 'center'
  ctx.fillText(`「${kw}」字飞花令`, w / 2, boxY + 28)

  ctx.font = '15px "KaiTi", "STKaiti", serif'
  currentPoem.lines.forEach((line, i) => {
    ctx.fillStyle = '#2C2824'
    ctx.textAlign = 'center'
    // Highlight keyword
    const parts = line.split(kw)
    const totalW = ctx.measureText(line).width
    let xPos = w / 2 - totalW / 2
    parts.forEach((part, pi) => {
      ctx.fillText(part, xPos + ctx.measureText(part).width / 2, boxY + 58 + i * 26)
      xPos += ctx.measureText(part).width
      if (pi < parts.length - 1) {
        ctx.fillStyle = '#C45D3E'
        ctx.fillText(kw, xPos + ctx.measureText(kw).width / 2, boxY + 58 + i * 26)
        xPos += ctx.measureText(kw).width
        ctx.fillStyle = '#2C2824'
      }
    })
  })

  // Stats
  ctx.fillStyle = '#8C8580'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`飘落字符: ${fallingChars.length}`, 16, h - 8)
  ctx.textAlign = 'right'
  ctx.fillText(`关键字: 「${kw}」`, w - 16, h - 8)
}

/* ───────── Poem Registry ───────── */

const poems: PoemDef[] = [
  {
    key: 'jys', name: '静夜思', dynasty: '唐', author: '李白',
    title: '静夜思',
    lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
    description: '这首诗写的是在寂静的月夜思念家乡的感受。诗的前两句写诗人在作客他乡的特定环境中一刹那间所产生的错觉。后两句通过动作神态的刻画，深化了思乡之情。',
    params: [
      { key: 'speed', label: '书写速度', min: 0.5, max: 3, step: 0.5, default: 1, unit: 'x' },
      { key: 'charSize', label: '字体大小', min: 32, max: 64, step: 4, default: 48, unit: 'px' },
    ],
  },
  {
    key: 'cx', name: '春晓', dynasty: '唐', author: '孟浩然',
    title: '春晓',
    lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
    description: '这首诗描绘了春天早晨的景象。诗人从春眠中醒来，听到鸟鸣，回忆起夜里的风雨，想到花儿不知被吹落了多少。语言平易浅近，自然天成。',
    params: [
      { key: 'sceneType', label: '场景', min: 0, max: 3, step: 1, default: 0, unit: '' },
    ],
  },
  {
    key: 'dgql', name: '登鹳雀楼', dynasty: '唐', author: '王之涣',
    title: '登鹳雀楼',
    lines: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'],
    description: '这首诗写诗人在登高望远中表现出来的不凡的胸襟抱负。前两句写所见，后两句写所想，把哲理与景物融为一体，成为千古传诵的名篇。',
    params: [
      { key: 'highlightLine', label: '高亮行', min: 0, max: 3, step: 1, default: 0, unit: '' },
    ],
  },
  {
    key: 'jx', name: '江雪', dynasty: '唐', author: '柳宗元',
    title: '江雪',
    lines: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'],
    description: '这首诗描绘了一幅江乡雪景图。山山是雪，路路皆白，飞鸟绝迹，人踪湮没。意境幽僻，风格峻洁，是柳宗元的代表作之一。',
    params: [
      { key: 'ffSpeed', label: '飘落速度', min: 0.5, max: 3, step: 0.5, default: 1, unit: 'x' },
      { key: 'ffKeyword', label: '关键字', min: 0, max: 3, step: 1, default: 0, unit: '' },
    ],
  },
]

/* ──────── Component ───────── */

export default function PoetryDemo() {
  const [selectedPoem, setSelectedPoem] = useState(poems[0])
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    poems[0].params.forEach((pd) => { p[pd.key] = pd.default })
    return p
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const initParams = useCallback((poem: PoemDef) => {
    const p: Record<string, number> = {}
    poem.params.forEach((pd) => { p[pd.key] = pd.default })
    setParams(p)
    setTime(0)
    setIsPlaying(false)
  }, [])

  useEffect(() => { initParams(selectedPoem) }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ctx, w, h } = setupCanvas(canvas)

    const drawFn: Record<string, Function> = {
      jys: drawWriting,
      cx: drawScene,
      dgql: drawMeter,
      jx: drawFlyingFlower,
    }
    drawFn[selectedPoem.key]?.(ctx, w, h, time, params)
  }, [selectedPoem, time, params])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    if (!isPlaying) return
    lastTimeRef.current = performance.now()
    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      setTime((t) => t + dt)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [isPlaying])

  const handlePoemChange = (poem: PoemDef) => {
    setSelectedPoem(poem)
    initParams(poem)
  }

  const handleReset = () => {
    setTime(0)
    setIsPlaying(false)
  }

  const handleParamChange = (key: string, val: number) => {
    setParams((p) => ({ ...p, [key]: val }))
    if (key === 'sceneType' || key === 'ffKeyword' || key === 'highlightLine') {
      setTime(0)
    }
  }

  const sceneNames = ['静夜思', '春晓', '登鹳雀楼', '江雪']
  const keywordNames = ['月', '花', '春', '风']

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          语文诗词可视化
        </div>
        <Title level={3} style={{ margin: 0 }}>诗词动画演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过动画形式感受古典诗词之美。书写动画展现汉字韵味，意境场景还原诗中画面，格律分析揭示音韵规律。
        </Paragraph>
      </div>

      {/* Poem selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {poems.map((poem) => (
          <button
            key={poem.key}
            onClick={() => handlePoemChange(poem)}
            style={{
              padding: '8px 18px', borderRadius: 4,
              border: `1px solid ${selectedPoem.key === poem.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedPoem.key === poem.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedPoem.key === poem.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: selectedPoem.key === poem.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            <BookOutlined style={{ marginRight: 6 }} />
            {poem.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'transparent', color: 'var(--ink-tertiary)', padding: 0,
            }}>{poem.dynasty}·{poem.author}</Tag>
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 24,
      }}>
        <div style={{
          border: '1px solid var(--border)', borderRadius: 8,
          overflow: 'hidden', background: '#FEFCF9',
        }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 420, display: 'block' }}
          />
        </div>

        {/* Code / Info panel */}
        <Card size="small" style={{ background: '#2C2824', color: '#E8E0D8', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#D4A853' }}>
            <BookOutlined style={{ marginRight: 6 }} />诗词原文
          </div>
          <div style={{ fontFamily: '"KaiTi", "STKaiti", serif', fontSize: 16, lineHeight: 2.2 }}>
            {selectedPoem.lines.map((line, i) => (
              <div key={i} style={{ textAlign: 'center', color: '#F5F0EB' }}>{line}</div>
            ))}
          </div>
          <div style={{
            marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: 12, color: '#8C8580', lineHeight: 1.8,
          }}>
            <div>{selectedPoem.dynasty} · {selectedPoem.author}</div>
            <div style={{ marginTop: 4 }}>《{selectedPoem.title}》</div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        <Button
          type="primary"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          {isPlaying ? '暂停' : '播放'}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
          t = {time.toFixed(1)}s
        </Text>
        <div style={{ flex: 1 }} />
        <Tag color="default">
          {isPlaying ? '播放中' : '就绪'}
        </Tag>
      </div>

      {/* Parameters */}
      <div style={{
        padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border)', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 16, letterSpacing: '0.05em' }}>
          参数调节
        </div>
        {selectedPoem.params.map((pd) => (
          <div key={pd.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ width: 100, fontSize: 13 }}>{pd.label}</Text>
            <Slider
              min={pd.min} max={pd.max} step={pd.step}
              value={params[pd.key] ?? pd.default}
              onChange={(v) => handleParamChange(pd.key, v)}
              style={{ flex: 1 }}
            />
            <Text style={{
              fontSize: 12, color: 'var(--ink-tertiary)',
              fontFamily: 'var(--font-mono)', width: 48, textAlign: 'right',
            }}>
              {params[pd.key] ?? pd.default}{pd.unit}
            </Text>
          </div>
        ))}

        {/* Special controls */}
        {selectedPoem.key === 'cx' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ width: 100, fontSize: 13 }}>场景切换</Text>
            {sceneNames.map((name, i) => (
              <Button
                key={i} size="small"
                type={params.sceneType === i ? 'primary' : 'default'}
                onClick={() => handleParamChange('sceneType', i)}
                style={params.sceneType === i ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
              >
                {name}
              </Button>
            ))}
          </div>
        )}
        {selectedPoem.key === 'jx' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ width: 100, fontSize: 13 }}>飞花关键字</Text>
            {keywordNames.map((kw, i) => (
              <Button
                key={i} size="small"
                type={params.ffKeyword === i ? 'primary' : 'default'}
                onClick={() => handleParamChange('ffKeyword', i)}
                style={params.ffKeyword === i ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
              >
                「{kw}」
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{
        padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 8, letterSpacing: '0.05em' }}>
          诗词赏析
        </div>
        <Title level={5} style={{ margin: '0 0 8px 0' }}>{selectedPoem.name}</Title>
        <Paragraph style={{ margin: 0, color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedPoem.description}
        </Paragraph>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Tag color="default">作者：{selectedPoem.dynasty}·{selectedPoem.author}</Tag>
          <Tag color="default">体裁：五言绝句</Tag>
        </div>
      </div>
    </div>
  )
}
