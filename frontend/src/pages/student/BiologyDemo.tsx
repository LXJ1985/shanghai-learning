import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag, Card } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Types ───────── */

interface BioDef {
  key: string
  name: string
  category: string
  formula: string
  description: string
  code: string
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

function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, color = '#F0F7F0') {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}

/* ───────── 1. Cell Division (细胞分裂) ──────── */

const mitosisStages = ['间期', '前期', '中期', '后期', '末期', '胞质分裂']

function drawCellDivision(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#F5F0EB')

  const speed = params.speed || 1
  const stageDuration = 3 // seconds per stage
  const totalDuration = stageDuration * mitosisStages.length
  const elapsed = (t * speed) % totalDuration
  const stageIdx = Math.min(Math.floor(elapsed / stageDuration), mitosisStages.length - 1)
  const stageProgress = (elapsed % stageDuration) / stageDuration

  const cx = w / 2
  const cy = h / 2 - 20
  const cellR = Math.min(w, h) * 0.28

  // Stage label
  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`有丝分裂 · ${mitosisStages[stageIdx]}`, w / 2, 30)

  // Stage progress bar
  const barW = 200
  const barH = 6
  const barX = (w - barW) / 2
  const barY = 42
  ctx.fillStyle = '#E0D8D0'
  ctx.fillRect(barX, barY, barW, barH)
  ctx.fillStyle = '#4A7C59'
  ctx.fillRect(barX, barY, barW * stageProgress, barH)

  // Draw cell membrane
  ctx.strokeStyle = '#4A7C59'
  ctx.lineWidth = 2.5

  if (stageIdx <= 3) {
    // Single cell
    ctx.beginPath()
    if (stageIdx === 3) {
      // Elongating in anaphase
      const stretch = 1 + stageProgress * 0.4
      ctx.ellipse(cx, cy, cellR * stretch, cellR * 0.85, 0, 0, Math.PI * 2)
    } else {
      ctx.arc(cx, cy, cellR, 0, Math.PI * 2)
    }
    ctx.stroke()

    // Cytoplasm
    ctx.fillStyle = 'rgba(74,124,89,0.06)'
    ctx.fill()
  } else {
    // Two cells forming (telophase/cytokinesis)
    const separation = stageIdx === 4 ? stageProgress * cellR * 0.5 : cellR * 0.6
    const pinch = stageIdx === 5 ? Math.max(0, 1 - stageProgress) * 0.3 : 0

    // Left cell
    ctx.beginPath()
    ctx.ellipse(cx - separation, cy, cellR * 0.7, cellR * 0.75, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(74,124,89,0.06)'
    ctx.fill()

    // Right cell
    ctx.beginPath()
    ctx.ellipse(cx + separation, cy, cellR * 0.7, cellR * 0.75, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fill()

    // Cleavage furrow
    if (pinch > 0) {
      ctx.strokeStyle = '#C45D3E'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(cx, cy - cellR * 0.7)
      ctx.lineTo(cx, cy + cellR * 0.7)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Draw chromosomes
  const chromColors = ['#C45D3E', '#8B5CF6', '#D4A853', '#3B82F6']

  if (stageIdx === 0) {
    // Interphase - chromatin (diffuse)
    ctx.fillStyle = '#C45D3E40'
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const r = cellR * 0.4 + Math.sin(i * 3.7) * cellR * 0.2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      ctx.beginPath()
      ctx.arc(x, y, 3 + Math.sin(i) * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // Nucleus
    ctx.strokeStyle = '#D0C8BE'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(cx, cy, cellR * 0.55, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  } else if (stageIdx === 1) {
    // Prophase - condensing chromosomes
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3
      const r = cellR * 0.3
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      drawChromosome(ctx, x, y, 18, chromColors[i], 0.7 + stageProgress * 0.3)
    }
    // Dissolving nuclear membrane
    ctx.strokeStyle = '#D0C8BE'
    ctx.lineWidth = 1
    ctx.globalAlpha = 1 - stageProgress * 0.5
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.arc(cx, cy, cellR * 0.55, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  } else if (stageIdx === 2) {
    // Metaphase - aligned at equator
    for (let i = 0; i < 4; i++) {
      const x = cx + (i - 1.5) * 30
      const y = cy + Math.sin(t * 2 + i) * 3 // slight vibration
      drawChromosome(ctx, x, y, 20, chromColors[i], 1)
    }
    // Spindle fibers
    ctx.strokeStyle = '#D0C8BE'
    ctx.lineWidth = 0.8
    for (let i = 0; i < 4; i++) {
      const x = cx + (i - 1.5) * 30
      const y = cy + Math.sin(t * 2 + i) * 3
      ctx.beginPath(); ctx.moveTo(cx - cellR * 0.7, cy - cellR * 0.7); ctx.lineTo(x, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + cellR * 0.7, cy + cellR * 0.7); ctx.lineTo(x, y); ctx.stroke()
    }
    // Equator line
    ctx.strokeStyle = '#D4A853'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx - cellR * 0.8, cy); ctx.lineTo(cx + cellR * 0.8, cy); ctx.stroke()
    ctx.setLineDash([])
  } else if (stageIdx === 3) {
    // Anaphase - separating
    const sep = stageProgress * cellR * 0.5
    for (let i = 0; i < 4; i++) {
      const x = cx + (i - 1.5) * 25
      drawChromosome(ctx, x - sep * 0.3, cy - sep, 16, chromColors[i], 1)
      drawChromosome(ctx, x + sep * 0.3, cy + sep, 16, chromColors[i], 1)
    }
    // Spindle fibers pulling
    ctx.strokeStyle = '#D0C8BE'
    ctx.lineWidth = 0.8
    for (let i = 0; i < 4; i++) {
      const x = cx + (i - 1.5) * 25
      ctx.beginPath(); ctx.moveTo(cx - cellR * 0.8, cy - cellR * 0.8); ctx.lineTo(x - sep * 0.3, cy - sep); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + cellR * 0.8, cy + cellR * 0.8); ctx.lineTo(x + sep * 0.3, cy + sep); ctx.stroke()
    }
  } else if (stageIdx === 4) {
    // Telophase - two nuclei forming
    const sep = cellR * 0.35
    for (let side = -1; side <= 1; side += 2) {
      const nx = cx + side * sep
      ctx.strokeStyle = '#D0C8BE'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(nx, cy, cellR * 0.35, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // Chromosomes decondensing
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        const r = cellR * 0.2
        drawChromosome(ctx, nx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 12, chromColors[i], 0.6)
      }
    }
  } else {
    // Cytokinesis - two separate cells
    const sep = cellR * 0.5
    for (let side = -1; side <= 1; side += 2) {
      const nx = cx + side * sep
      ctx.strokeStyle = '#D0C8BE'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(nx, cy, cellR * 0.3, 0, Math.PI * 2)
      ctx.stroke()
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        const r = cellR * 0.15
        ctx.fillStyle = chromColors[i] + '60'
        ctx.beginPath()
        ctx.arc(nx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Stage indicators
  const dotY = h - 30
  mitosisStages.forEach((name, i) => {
    const dx = w / 2 + (i - 2.5) * 70
    ctx.fillStyle = i === stageIdx ? '#C45D3E' : '#D0C8BE'
    ctx.beginPath(); ctx.arc(dx, dotY, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = i === stageIdx ? '#2C2824' : '#9C9590'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(name, dx, dotY + 16)
  })
}

function drawChromosome(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  // X shape
  ctx.beginPath()
  ctx.moveTo(x - size * 0.4, y - size * 0.5)
  ctx.lineTo(x + size * 0.4, y + size * 0.5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + size * 0.4, y - size * 0.5)
  ctx.lineTo(x - size * 0.4, y + size * 0.5)
  ctx.stroke()
  // Centromere
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/* ───────── 2. Photosynthesis (光合作用) ───────── */

function drawPhotosynthesis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#E8F5E9')

  const lightIntensity = params.light || 0.7
  const co2Level = params.co2 || 0.5

  const cx = w / 2
  const cy = h / 2

  // Title
  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('光合作用 · 叶绿体', w / 2, 30)

  // Chloroplast (oval shape)
  const chloroW = w * 0.55
  const chloroH = h * 0.5
  ctx.fillStyle = '#A5D6A7'
  ctx.strokeStyle = '#4A7C59'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(cx, cy, chloroW / 2, chloroH / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Thylakoid stacks (grana)
  const granaCount = 4
  for (let g = 0; g < granaCount; g++) {
    const gx = cx - chloroW * 0.3 + g * (chloroW * 0.6 / (granaCount - 1))
    const gy = cy
    const stackH = 50 + Math.sin(g * 2.1) * 15

    for (let s = 0; s < 5; s++) {
      const sy = gy - stackH / 2 + s * (stackH / 5)
      const pulse = Math.sin(t * 3 + g + s * 0.5) * 0.15 + 0.85
      ctx.fillStyle = `rgba(56,142,60,${0.5 * pulse})`
      ctx.strokeStyle = '#2E7D32'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(gx, sy, 18, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Light absorption glow
    if (lightIntensity > 0.3) {
      ctx.fillStyle = `rgba(255,235,59,${lightIntensity * 0.3 * (Math.sin(t * 4 + g) * 0.3 + 0.7)})`
      ctx.beginPath()
      ctx.arc(gx, gy - stackH / 2 - 10, 12, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Stroma (background of chloroplast)
  ctx.fillStyle = 'rgba(200,230,201,0.3)'
  ctx.beginPath()
  ctx.ellipse(cx, cy, chloroW / 2 - 10, chloroH / 2 - 10, 0, 0, Math.PI * 2)
  ctx.fill()

  // Input arrows - H2O
  drawArrow(ctx, 30, cy - 40, cx - chloroW / 2 + 20, cy - 30, '#3B82F6', 'H₂O')
  // Input arrows - CO2
  drawArrow(ctx, 30, cy + 40, cx - chloroW / 2 + 20, cy + 30, '#8B5CF6', 'CO₂')
  // Input - Light
  const lightAlpha = lightIntensity * 0.8
  ctx.strokeStyle = `rgba(212,168,83,${lightAlpha})`
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(w - 60, 50)
  ctx.lineTo(cx + chloroW / 2 - 20, cy - chloroH / 2 + 20)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = `rgba(212,168,83,${lightAlpha})`
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('☀ 光能', w - 65, 46)

  // Output arrows - O2
  drawArrow(ctx, cx - chloroW / 2 + 20, cy + 60, 30, cy + 80, '#4A7C59', 'O₂')
  // Output - Glucose (C6H12O6)
  drawArrow(ctx, cx + chloroW / 2 - 20, cy + 30, w - 60, cy + 60, '#C45D3E', 'C₆H₁₂O₆')

  // Animated particles
  // Water molecules entering
  for (let i = 0; i < 6; i++) {
    const progress = ((t * 0.5 + i * 0.17) % 1)
    const px = 30 + progress * (cx - chloroW / 2 - 10)
    const py = cy - 40 + Math.sin(t * 3 + i * 2) * 10
    ctx.fillStyle = '#3B82F6'
    ctx.globalAlpha = 0.7
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }

  // CO2 molecules
  for (let i = 0; i < 5; i++) {
    const progress = ((t * 0.4 + i * 0.2) % 1)
    const px = 30 + progress * (cx - chloroW / 2 - 10)
    const py = cy + 40 + Math.cos(t * 2.5 + i * 1.5) * 10
    ctx.fillStyle = '#8B5CF6'
    ctx.globalAlpha = 0.7
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }

  // O2 bubbles leaving
  for (let i = 0; i < 4; i++) {
    const progress = ((t * 0.3 + i * 0.25) % 1)
    const px = cx - chloroW / 2 + 20 - progress * (cx - chloroW / 2 - 10)
    const py = cy + 60 + Math.sin(t * 2 + i * 3) * 8
    ctx.fillStyle = '#4A7C59'
    ctx.globalAlpha = 0.6
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }

  // Equation
  ctx.fillStyle = '#2C2824'
  ctx.font = '14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', w / 2, h - 20)

  // Stats
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#6B6560'
  ctx.fillText(`光照强度: ${(lightIntensity * 100).toFixed(0)}%`, 16, h - 40)
  ctx.fillText(`CO₂浓度: ${(co2Level * 100).toFixed(0)}%`, 16, h - 24)
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLen = 10

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Arrowhead
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
  ctx.fill()

  // Label
  ctx.fillStyle = color
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 10)
}

/* ───────── 3. DNA Double Helix (DNA双螺旋) ───────── */

function drawDNA(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#F0F0FF')

  const rotSpeed = params.rotSpeed || 1
  const showLabels = params.showLabels || 1

  const cx = w / 2
  const cy = h / 2
  const helixH = h * 0.75
  const helixR = w * 0.2
  const turns = 3
  const points = 80

  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('DNA 双螺旋结构', w / 2, 30)

  // Base pair colors
  const pairColors: Record<string, string> = {
    'A-T': '#C45D3E',
    'T-A': '#C45D3E',
    'G-C': '#3B82F6',
    'C-G': '#3B82F6',
  }

  const bases = ['A', 'T', 'G', 'C']
  const pairs = [['A', 'T'], ['T', 'A'], ['G', 'C'], ['C', 'G']]

  // Draw base pairs (rungs)
  for (let i = 0; i < points; i++) {
    const frac = i / points
    const angle = frac * turns * Math.PI * 2 + t * rotSpeed
    const y = cy - helixH / 2 + frac * helixH

    const x1 = cx + Math.cos(angle) * helixR
    const x2 = cx + Math.cos(angle + Math.PI) * helixR
    const z1 = Math.sin(angle)
    const z2 = Math.sin(angle + Math.PI)

    // Only draw if at least one end is in front
    if (z1 > -0.3 || z2 > -0.3) {
      const pairIdx = i % 4
      const pair = pairs[pairIdx]
      const color = pairColors[`${pair[0]}-${pair[1]}`]

      ctx.strokeStyle = color + '80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1, y)
      ctx.lineTo(x2, y)
      ctx.stroke()

      // Base labels
      if (showLabels > 0.5) {
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = color
        ctx.fillText(pair[0], x1, y - 5)
        ctx.fillText(pair[1], x2, y - 5)
      }
    }
  }

  // Draw backbone strands
  for (let strand = 0; strand < 2; strand++) {
    ctx.strokeStyle = strand === 0 ? '#4A7C59' : '#8B5CF6'
    ctx.lineWidth = 3
    ctx.beginPath()
    let first = true

    for (let i = 0; i <= points; i++) {
      const frac = i / points
      const angle = frac * turns * Math.PI * 2 + t * rotSpeed + strand * Math.PI
      const y = cy - helixH / 2 + frac * helixH
      const x = cx + Math.cos(angle) * helixR
      const z = Math.sin(angle)

      if (z > -0.5) {
        ctx.globalAlpha = 0.4 + z * 0.3 + 0.3
        if (first) { ctx.moveTo(x, y); first = false }
        else ctx.lineTo(x, y)
      } else {
        first = true
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Sugar-phosphate backbone dots
  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < points; i += 4) {
      const frac = i / points
      const angle = frac * turns * Math.PI * 2 + t * rotSpeed + strand * Math.PI
      const y = cy - helixH / 2 + frac * helixH
      const x = cx + Math.cos(angle) * helixR
      const z = Math.sin(angle)

      if (z > -0.3) {
        ctx.fillStyle = strand === 0 ? '#4A7C59' : '#8B5CF6'
        ctx.globalAlpha = 0.5 + z * 0.3
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.globalAlpha = 1

  // Legend
  const lx = w - 130
  const ly = 60
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'

  const legendItems = [
    ['腺嘌呤 A', '#C45D3E'],
    ['胸腺嘧啶 T', '#C45D3E'],
    ['鸟嘌呤 G', '#3B82F6'],
    ['胞嘧啶 C', '#3B82F6'],
    ['脱氧核糖-磷酸', '#4A7C59'],
  ]
  legendItems.forEach(([label, color], i) => {
    ctx.fillStyle = color
    ctx.fillRect(lx, ly + i * 20, 12, 12)
    ctx.fillStyle = '#6B6560'
    ctx.fillText(label as string, lx + 18, ly + i * 20 + 10)
  })

  // Info
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('碱基互补配对: A=T, G≡C', 16, h - 36)
  ctx.fillText('反向平行双螺旋 · 右手螺旋', 16, h - 18)
}

/* ───────── 4. Ecosystem Energy Flow (生态系统能量流动) ───────── */

interface EnergyParticle {
  x: number
  y: number
  tx: number
  ty: number
  progress: number
  speed: number
  energy: number
}

let energyParticles: EnergyParticle[] = []

function drawEcosystem(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#FFF8E1')

  const flowSpeed = params.flowSpeed || 1

  const cx = w / 2
  const cy = h / 2

  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('生态系统能量流动', w / 2, 30)

  // Trophic levels
  const levels = [
    { name: '生产者', sub: '绿色植物', energy: 10000, color: '#4A7C59', y: h * 0.22, icon: '' },
    { name: '初级消费者', sub: '草食动物', energy: 1000, color: '#D4A853', y: h * 0.42, icon: '🐇' },
    { name: '次级消费者', sub: '肉食动物', energy: 100, color: '#C45D3E', y: h * 0.62, icon: '🦊' },
    { name: '三级消费者', sub: '顶级捕食者', energy: 10, color: '#8B5CF6', y: h * 0.82, icon: '🦅' },
  ]

  const barMaxW = w * 0.35
  const barH = 36

  // Draw energy bars
  levels.forEach((level, i) => {
    const barW = barMaxW * (level.energy / 10000)
    const x = cx - barW / 2

    // Bar background
    ctx.fillStyle = level.color + '20'
    ctx.strokeStyle = level.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(x, level.y - barH / 2, barW, barH, 6)
    ctx.fill()
    ctx.stroke()

    // Animated fill
    const fillProgress = Math.min(t * 0.5 * flowSpeed, 1)
    ctx.fillStyle = level.color + '40'
    ctx.beginPath()
    ctx.roundRect(x, level.y - barH / 2, barW * fillProgress, barH, 6)
    ctx.fill()

    // Label
    ctx.fillStyle = '#2C2824'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${level.icon} ${level.name}`, cx, level.y - barH / 2 - 8)
    ctx.fillStyle = '#8C8580'
    ctx.font = '11px sans-serif'
    ctx.fillText(level.sub, cx, level.y - barH / 2 - 22)

    // Energy value
    ctx.fillStyle = level.color
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${level.energy} kJ`, cx + barW / 2 + 10, level.y + 4)

    // Transfer efficiency
    if (i < levels.length - 1) {
      const efficiency = 10
      ctx.fillStyle = '#8C8580'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`传递效率 ~${efficiency}%`, cx - barW / 2 - 10, level.y + 4)
    }
  })

  // Energy flow arrows between levels
  for (let i = 0; i < levels.length - 1; i++) {
    const fromY = levels[i].y + barH / 2 + 5
    const toY = levels[i + 1].y - barH / 2 - 5
    const arrowX = cx + barMaxW / 2 + 40

    ctx.strokeStyle = levels[i].color + '60'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(arrowX, fromY)
    ctx.lineTo(arrowX, toY)
    ctx.stroke()
    ctx.setLineDash([])

    // Arrowhead
    ctx.fillStyle = levels[i].color + '60'
    ctx.beginPath()
    ctx.moveTo(arrowX, toY)
    ctx.lineTo(arrowX - 5, toY - 8)
    ctx.lineTo(arrowX + 5, toY - 8)
    ctx.fill()
  }

  // Heat loss arrows (right side)
  levels.forEach((level, i) => {
    const heatX = cx + barMaxW / 2 + 70
    const heatLen = 30 + (1 - level.energy / 10000) * 40
    ctx.strokeStyle = '#C45D3E40'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(heatX, level.y)
    ctx.lineTo(heatX + heatLen, level.y - 15)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#C45D3E80'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('呼吸散热', heatX + heatLen + 4, level.y - 12)
  })

  // Sun energy input
  const sunPulse = Math.sin(t * 2) * 0.2 + 0.8
  ctx.fillStyle = `rgba(212,168,83,${sunPulse * 0.3})`
  ctx.beginPath()
  ctx.arc(50, 55, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#D4A853'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('', 50, 60)
  ctx.font = '10px sans-serif'
  ctx.fillText('太阳能', 50, 82)

  // Arrow from sun to producer
  ctx.strokeStyle = '#D4A85380'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(70, 65)
  ctx.lineTo(cx - barMaxW * 0.3, levels[0].y - barH / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Decomposer note
  ctx.fillStyle = '#8C8580'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('分解者（细菌/真菌）分解各营养级有机物，能量以热能散失', w / 2, h - 12)
}

/* ───────── Module Registry ───────── */

const modules: BioDef[] = [
  {
    key: 'cell', name: '细胞分裂', category: '细胞生物学',
    formula: '有丝分裂: 间期→前期→中期→后期→末期→胞质分裂',
    description: '有丝分裂是真核细胞分裂的基本方式，保证遗传物质精确均分到两个子细胞中。整个过程分为间期（DNA复制）、前期（染色体凝集）、中期（排列在赤道板）、后期（姐妹染色单体分离）、末期（核膜重建）和胞质分裂。',
    code: `// 有丝分裂各阶段
间期: DNA复制, 细胞生长
前期: 染色质→染色体, 核膜消失
      纺锤体形成
中期: 染色体排列在赤道板
      着丝粒与纺锤丝相连
后期: 着丝粒分裂
      姐妹染色单体→两极
末期: 染色体→染色质
      核膜重建, 纺锤体消失
胞质分裂: 细胞膜内陷/细胞板形成

// 结果: 1个母细胞 → 2个子细胞
// 染色体数: 2n → 2n (保持不变)`,
    params: [
      { key: 'speed', label: '动画速度', min: 0.5, max: 3, step: 0.5, default: 1, unit: 'x' },
    ],
  },
  {
    key: 'photo', name: '光合作用', category: '植物生理学',
    formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    description: '光合作用是绿色植物利用光能将二氧化碳和水转化为有机物（葡萄糖）并释放氧气的过程。分为光反应（类囊体膜上，产生ATP和NADPH）和暗反应/卡尔文循环（叶绿体基质中，固定CO₂合成葡萄糖）。',
    code: `// 光合作用总反应式
6CO₂ + 6H₂O --光能--> C₆H₁₂O₆ + 6O₂

// 光反应 (类囊体膜)
H₂O --光解--> 2H⁺ + ½O₂ + 2e⁻
ADP + Pi --光合磷酸化--> ATP
NADP⁺ + H⁺ + 2e⁻ --> NADPH

// 暗反应/卡尔文循环 (基质)
CO₂ + C₅ --固定--> 2C
C₃ + ATP + NADPH --> (CH₂O) + C

// 影响因素: 光照强度、CO₂浓度、温度`,
    params: [
      { key: 'light', label: '光照强度', min: 0.1, max: 1, step: 0.1, default: 0.7, unit: '' },
      { key: 'co2', label: 'CO₂浓度', min: 0.1, max: 1, step: 0.1, default: 0.5, unit: '' },
    ],
  },
  {
    key: 'dna', name: 'DNA双螺旋', category: '分子生物学',
    formula: '碱基互补配对: A=T (2氢键), GC (3氢键)',
    description: 'DNA（脱氧核糖核酸）是携带遗传信息的双螺旋分子。由两条反向平行的多核苷酸链组成，外侧是脱氧核糖-磷酸骨架，内侧是碱基对。遵循碱基互补配对原则：A与T配对（2个氢键），G与C配对（3个氢键）。',
    code: `// DNA结构
双螺旋: 两条反向平行多核苷酸链
骨架: 脱氧核糖 + 磷酸 (外侧)
碱基: A, T, G, C (内侧)

// 碱基互补配对
A = T  (2个氢键)
G ≡ C  (3个氢键)

//  Chargaff规则
A = T, G = C
嘌呤 = 嘧啶

// 方向性: 5'→3' 和 3'→5'
// 螺距: 3.4nm, 每圈10个碱基对`,
    params: [
      { key: 'rotSpeed', label: '旋转速度', min: 0.2, max: 3, step: 0.2, default: 1, unit: 'x' },
      { key: 'showLabels', label: '显示碱基', min: 0, max: 1, step: 1, default: 1, unit: '' },
    ],
  },
  {
    key: 'eco', name: '能量流动', category: '生态学',
    formula: '能量传递效率: 10%~20% (林德曼效率)',
    description: '生态系统中能量沿食物链单向流动、逐级递减。生产者固定太阳能，通过摄食关系传递给各级消费者。每个营养级只有约10%-20%的能量传递到下一营养级，其余通过呼吸作用以热能形式散失。这决定了食物链通常不超过4-5个营养级。',
    code: `// 能量流动特点
1. 单向流动 (不可逆转)
2. 逐级递减 (10%~20%)

// 营养级能量分配
摄入量 = 同化量 + 粪便量
同化量 = 呼吸散失 + 生长发育繁殖
生长发育繁殖 = 流向下一营养级
              + 流向分解者 + 未利用

// 林德曼效率 ~10%
生产者:    10000 kJ
初级消费者: 1000 kJ  (10%)
次级消费者:  100 kJ  (10%)
三级消费者:   10 kJ  (10%)

// 能量金字塔: 正金字塔形
// 食物链一般不超过4-5个营养级`,
    params: [
      { key: 'flowSpeed', label: '流动速度', min: 0.5, max: 3, step: 0.5, default: 1, unit: 'x' },
    ],
  },
]

/* ───────── Component ───────── */

export default function BiologyDemo() {
  const [selectedModule, setSelectedModule] = useState(modules[0])
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    modules[0].params.forEach((pd) => { p[pd.key] = pd.default })
    return p
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const initParams = useCallback((mod: BioDef) => {
    const p: Record<string, number> = {}
    mod.params.forEach((pd) => { p[pd.key] = pd.default })
    setParams(p)
    setTime(0)
    setIsPlaying(false)
  }, [])

  useEffect(() => { initParams(selectedModule) }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ctx, w, h } = setupCanvas(canvas)

    const drawFn: Record<string, Function> = {
      cell: drawCellDivision,
      photo: drawPhotosynthesis,
      dna: drawDNA,
      eco: drawEcosystem,
    }
    drawFn[selectedModule.key]?.(ctx, w, h, time, params)
  }, [selectedModule, time, params])

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

  const handleModuleChange = (mod: BioDef) => {
    setSelectedModule(mod)
    initParams(mod)
  }

  const handleReset = () => {
    setTime(0)
    setIsPlaying(false)
  }

  const handleParamChange = (key: string, val: number) => {
    setParams((p) => ({ ...p, [key]: val }))
    setTime(0)
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          生物知识可视化
        </div>
        <Title level={3} style={{ margin: 0 }}>生物知识演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过动态图形直观理解生物学核心概念。从细胞分裂到生态系统，用动画揭示生命科学的精妙机制。
        </Paragraph>
      </div>

      {/* Module selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {modules.map((mod) => (
          <button
            key={mod.key}
            onClick={() => handleModuleChange(mod)}
            style={{
              padding: '8px 18px', borderRadius: 4,
              border: `1px solid ${selectedModule.key === mod.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedModule.key === mod.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedModule.key === mod.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: selectedModule.key === mod.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            <ExperimentOutlined style={{ marginRight: 6 }} />
            {mod.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'transparent', color: 'var(--ink-tertiary)', padding: 0,
            }}>{mod.category}</Tag>
          </button>
        ))}
      </div>

      {/* Canvas + Code panel */}
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

        {/* Code panel */}
        <Card size="small" style={{ background: '#2C2824', color: '#E8E0D8', borderRadius: 8, overflow: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#D4A853' }}>
            <ExperimentOutlined style={{ marginRight: 6 }} />知识要点
          </div>
          <pre style={{
            margin: 0, fontSize: 11, lineHeight: 1.7,
            color: '#C8C0B8', fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {selectedModule.code}
          </pre>
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
        <Tag color="default">{isPlaying ? '播放中' : '就绪'}</Tag>
      </div>

      {/* Parameters */}
      <div style={{
        padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border)', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 16, letterSpacing: '0.05em' }}>
          参数调节
        </div>
        {selectedModule.params.map((pd) => (
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
      </div>

      {/* Description */}
      <div style={{
        padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 8, letterSpacing: '0.05em' }}>
          知识要点
        </div>
        <Title level={5} style={{ margin: '0 0 8px 0' }}>{selectedModule.name}</Title>
        <Paragraph style={{ margin: '0 0 12px 0', color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedModule.description}
        </Paragraph>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color="default">类别：{selectedModule.category}</Tag>
          <Tag color="default" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {selectedModule.formula}
          </Tag>
        </div>
      </div>
    </div>
  )
}
