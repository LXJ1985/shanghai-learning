import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag, Card } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Types ───────── */

interface GeoDef {
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

function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, color = '#F0F4F8') {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}

/* ───────── 1. Earth Rotation & Revolution (地球运动) ───────── */

function drawEarthMotion(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const showSeason = params.showSeason || 1
  const speed = params.speed || 1

  const cx = w / 2
  const cy = h / 2
  const orbitR = Math.min(w, h) * 0.32
  const earthR = 22

  // Background - space
  const spaceGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7)
  spaceGrad.addColorStop(0, '#1A1A3E')
  spaceGrad.addColorStop(1, '#0A0A1E')
  ctx.fillStyle = spaceGrad
  ctx.fillRect(0, 0, w, h)

  // Stars
  ctx.fillStyle = '#FFF'
  for (let i = 0; i < 80; i++) {
    const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w
    const sy = (Math.cos(i * 269.5 + 183.3) * 0.5 + 0.5) * h
    const twinkle = Math.sin(t * 2 + i * 1.3) * 0.3 + 0.7
    ctx.globalAlpha = twinkle * 0.6
    ctx.beginPath(); ctx.arc(sx, sy, Math.random() * 1.2 + 0.3, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  // Sun
  const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50)
  sunGlow.addColorStop(0, '#FFF9C4')
  sunGlow.addColorStop(0.3, '#FFD54F')
  sunGlow.addColorStop(0.7, '#FF8F00')
  sunGlow.addColorStop(1, 'rgba(255,143,0,0)')
  ctx.fillStyle = sunGlow
  ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFF176'
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill()

  // Orbit path
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 6])
  ctx.beginPath(); ctx.ellipse(cx, cy, orbitR, orbitR * 0.4, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.setLineDash([])

  // Earth position on orbit
  const orbitAngle = t * 0.3 * speed
  const earthX = cx + Math.cos(orbitAngle) * orbitR
  const earthY = cy + Math.sin(orbitAngle) * orbitR * 0.4

  // Season label
  const seasonAngle = ((orbitAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const seasons = ['春分', '夏至', '秋分', '冬至']
  const seasonIdx = Math.floor(seasonAngle / (Math.PI / 2)) % 4

  if (showSeason > 0.5) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(seasons[seasonIdx], earthX, earthY - 40)
  }

  // Earth shadow (night side)
  const sunDir = Math.atan2(cy - earthY, cx - earthX)

  // Earth body
  const earthGrad = ctx.createRadialGradient(
    earthX - 5, earthY - 5, 0,
    earthX, earthY, earthR
  )
  earthGrad.addColorStop(0, '#4FC3F7')
  earthGrad.addColorStop(0.5, '#2196F3')
  earthGrad.addColorStop(1, '#0D47A1')
  ctx.fillStyle = earthGrad
  ctx.beginPath(); ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2); ctx.fill()

  // Continents (simplified)
  ctx.fillStyle = '#4CAF50'
  const rotAngle = t * 2 * speed
  for (let i = 0; i < 3; i++) {
    const ca = rotAngle + i * 2.1
    const lx = earthX + Math.cos(ca) * earthR * 0.4
    const ly = earthY + Math.sin(ca * 0.7 + i) * earthR * 0.3
    if (Math.cos(ca - sunDir) > -0.3) {
      ctx.beginPath(); ctx.arc(lx, ly, 6 + i * 2, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Night shadow overlay
  ctx.fillStyle = 'rgba(0,0,20,0.5)'
  ctx.beginPath()
  ctx.arc(earthX, earthY, earthR, sunDir + Math.PI / 2, sunDir - Math.PI / 2)
  ctx.fill()

  // Axis tilt
  const tilt = 23.5 * Math.PI / 180
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(earthX - Math.sin(tilt) * earthR * 1.5, earthY - Math.cos(tilt) * earthR * 1.5)
  ctx.lineTo(earthX + Math.sin(tilt) * earthR * 1.5, earthY + Math.cos(tilt) * earthR * 1.5)
  ctx.stroke()
  ctx.setLineDash([])

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('地球公转与四季', w / 2, 30)

  // Info
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`公转角度: ${((seasonAngle * 180 / Math.PI)).toFixed(0)}°`, 16, h - 36)
  ctx.fillText(`地轴倾角: 23.5°`, 16, h - 18)

  // Season markers on orbit
  const markerLabels = ['春分', '夏至', '秋分', '冬至']
  const markerAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
  markerAngles.forEach((ma, i) => {
    const mx = cx + Math.cos(ma) * orbitR
    const my = cy + Math.sin(ma) * orbitR * 0.4
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(markerLabels[i], mx, my + 16)
  })
}

/* ───────── 2. Plate Tectonics (板块构造) ───────── */

function drawPlateTectonics(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#E3F2FD')

  const cx = w / 2
  const cy = h / 2 + 10

  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('板块构造与地壳运动', w / 2, 30)

  const viewMode = Math.round(params.viewMode || 0) // 0=drift, 1=boundary

  if (viewMode === 0) {
    // Continental drift animation
    const driftProgress = Math.min(t * 0.08, 1)

    // Ocean background
    ctx.fillStyle = '#90CAF9'
    ctx.fillRect(0, 60, w, h - 80)

    // Simplified continent shapes (Pangaea → modern)
    const continents = [
      { name: '北美', color: '#66BB6A', startX: cx - 60, startY: cy - 80, endX: cx - 180, endY: cy - 100, w: 70, h: 60 },
      { name: '南美', color: '#81C784', startX: cx - 30, startY: cy + 10, endX: cx - 130, endY: cy + 40, w: 50, h: 80 },
      { name: '欧洲', color: '#A5D6A7', startX: cx + 10, startY: cy - 90, endX: cx - 20, endY: cy - 110, w: 50, h: 40 },
      { name: '非洲', color: '#4CAF50', startX: cx + 10, startY: cy - 20, endX: cx + 10, endY: cy - 10, w: 60, h: 80 },
      { name: '亚洲', color: '#388E3C', startX: cx + 60, startY: cy - 80, endX: cx + 140, endY: cy - 90, w: 100, h: 70 },
      { name: '澳洲', color: '#2E7D32', startX: cx + 80, startY: cy + 40, endX: cx + 180, endY: cy + 60, w: 50, h: 40 },
    ]

    continents.forEach(c => {
      const x = c.startX + (c.endX - c.startX) * driftProgress
      const y = c.startY + (c.endY - c.startY) * driftProgress

      ctx.fillStyle = c.color
      ctx.beginPath()
      ctx.roundRect(x - c.w / 2, y - c.h / 2, c.w, c.h, 8)
      ctx.fill()

      ctx.fillStyle = '#FFF'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(c.name, x, y + 4)
    })

    // Time label
    const yearsAgo = Math.round(250 - driftProgress * 250)
    ctx.fillStyle = '#2C2824'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${yearsAgo} 百万年前`, w / 2, h - 30)

    // Timeline
    ctx.strokeStyle = '#90A4AE'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(60, h - 50); ctx.lineTo(w - 60, h - 50); ctx.stroke()
    ctx.fillStyle = '#C45D3E'
    ctx.beginPath(); ctx.arc(60 + driftProgress * (w - 120), h - 50, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#6B6560'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('2.5亿年前 (盘古大陆)', 60, h - 58)
    ctx.textAlign = 'right'
    ctx.fillText('现在', w - 60, h - 58)
  } else {
    // Plate boundary types
    const boundaryType = Math.round(params.boundaryType || 0)

    // Ocean background
    ctx.fillStyle = '#90CAF9'
    ctx.fillRect(0, 60, w, h - 80)

    const types = [
      { name: '离散边界 (生长边界)', desc: '板块分离，岩浆上涌形成新地壳', color1: '#66BB6A', color2: '#43A047' },
      { name: '汇聚边界 (消亡边界)', desc: '板块碰撞，一个俯冲到另一个下方', color1: '#EF5350', color2: '#E53935' },
      { name: '转换边界', desc: '板块水平错动，产生地震', color1: '#FFA726', color2: '#FB8C00' },
    ]
    const bt = types[boundaryType]

    ctx.fillStyle = '#2C2824'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(bt.name, w / 2, 55)

    if (boundaryType === 0) {
      // Divergent boundary - plates moving apart
      const gap = 20 + Math.sin(t * 1.5) * 8
      // Left plate
      ctx.fillStyle = bt.color1
      ctx.fillRect(0, cy - 40, cx - gap / 2, 80)
      // Right plate
      ctx.fillStyle = bt.color2
      ctx.fillRect(cx + gap / 2, cy - 40, cx, 80)
      // Magma rising
      const magmaH = 30 + Math.sin(t * 3) * 10
      ctx.fillStyle = '#FF5722'
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy + 40)
      ctx.quadraticCurveTo(cx, cy + 40 - magmaH, cx + 10, cy + 40)
      ctx.fill()
      // Arrows
      drawArrowH(ctx, cx - 60, cy, cx - gap / 2 - 10, cy, '#FFF', '←')
      drawArrowH(ctx, cx + 60, cy, cx + gap / 2 + 10, cy, '#FFF', '→')
    } else if (boundaryType === 1) {
      // Convergent boundary - subduction
      const subduct = Math.sin(t * 1.2) * 5
      // Left plate (oceanic, subducting)
      ctx.fillStyle = bt.color1
      ctx.save()
      ctx.translate(cx - 20, cy)
      ctx.rotate(0.15)
      ctx.fillRect(-cx / 2, -20, cx / 2, 40)
      ctx.restore()
      // Right plate (continental, overriding)
      ctx.fillStyle = bt.color2
      ctx.fillRect(cx - 20, cy - 30, cx / 2 + 20, 60)
      // Mountain formation
      ctx.fillStyle = '#795548'
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy - 30)
      ctx.lineTo(cx + 20, cy - 70 - subduct)
      ctx.lineTo(cx + 50, cy - 30)
      ctx.fill()
      // Volcano
      ctx.fillStyle = '#FF5722'
      ctx.beginPath()
      ctx.arc(cx + 20, cy - 72 - subduct, 5, 0, Math.PI * 2)
      ctx.fill()
      // Arrows
      drawArrowH(ctx, cx - 80, cy + 10, cx - 30, cy + 10, '#FFF', '→')
      drawArrowH(ctx, cx + 100, cy + 10, cx + 50, cy + 10, '#FFF', '←')
    } else {
      // Transform boundary
      const offset = Math.sin(t * 2) * 15
      // Upper plate
      ctx.fillStyle = bt.color1
      ctx.fillRect(0, cy - 40 + offset / 2, w, 38)
      // Lower plate
      ctx.fillStyle = bt.color2
      ctx.fillRect(0, cy + 2 + offset / 2, w, 38)
      // Fault line
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(0, cy + 1); ctx.lineTo(w, cy + 1); ctx.stroke()
      ctx.setLineDash([])
      // Earthquake waves
      for (let i = 0; i < 3; i++) {
        const waveR = ((t * 40 + i * 30) % 80)
        ctx.strokeStyle = `rgba(255,87,34,${1 - waveR / 80})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(cx, cy + 1, waveR, 0, Math.PI * 2); ctx.stroke()
      }
      // Arrows
      drawArrowH(ctx, 60, cy - 20, 140, cy - 20, '#FFF', '→')
      drawArrowH(ctx, w - 60, cy + 22, w - 140, cy + 22, '#FFF', '←')
    }

    // Description
    ctx.fillStyle = '#6B6560'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(bt.desc, w / 2, h - 30)
  }
}

function drawArrowH(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, _y2: number, color: string, label: string) {
  const dir = x2 > x1 ? 1 : -1
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x2, y)
  ctx.lineTo(x2 - dir * 8, y - 5)
  ctx.lineTo(x2 - dir * 8, y + 5)
  ctx.fill()
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, (x1 + x2) / 2, y - 10)
}

/* ───────── 3. Water Cycle (水循环) ───────── */

interface WaterDrop {
  x: number
  y: number
  vy: number
  size: number
  opacity: number
  phase: number // 0=evaporating, 1=condensing, 2=precipitating, 3=flowing
}

let waterDrops: WaterDrop[] = []

function drawWaterCycle(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const temp = params.temp || 0.6

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  skyGrad.addColorStop(0, '#87CEEB')
  skyGrad.addColorStop(1, '#E0F0FF')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h * 0.6)

  // Ground
  const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h)
  groundGrad.addColorStop(0, '#8BC34A')
  groundGrad.addColorStop(0.3, '#689F38')
  groundGrad.addColorStop(1, '#5D4037')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, h * 0.55, w, h * 0.45)

  // Mountains
  ctx.fillStyle = '#795548'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.58)
  ctx.lineTo(w * 0.15, h * 0.3)
  ctx.lineTo(w * 0.3, h * 0.5)
  ctx.lineTo(w * 0.4, h * 0.35)
  ctx.lineTo(w * 0.55, h * 0.55)
  ctx.lineTo(w * 0.55, h * 0.58)
  ctx.fill()

  // Snow caps
  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.moveTo(w * 0.12, h * 0.35)
  ctx.lineTo(w * 0.15, h * 0.3)
  ctx.lineTo(w * 0.18, h * 0.35)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(w * 0.37, h * 0.39)
  ctx.lineTo(w * 0.4, h * 0.35)
  ctx.lineTo(w * 0.43, h * 0.39)
  ctx.fill()

  // Ocean / Lake
  ctx.fillStyle = '#1E88E5'
  ctx.fillRect(0, h * 0.56, w * 0.55, h * 0.06)
  // Wave animation
  ctx.strokeStyle = '#42A5F5'
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    for (let x = 0; x < w * 0.55; x += 2) {
      const y = h * 0.57 + i * 6 + Math.sin(x * 0.05 + t * 2 + i) * 2
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Sun
  const sunPulse = Math.sin(t * 1.5) * 0.1 + 0.9
  ctx.fillStyle = `rgba(255,235,59,${sunPulse * 0.3})`
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, 35, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFD54F'
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, 22, 0, Math.PI * 2); ctx.fill()

  // Clouds
  for (let i = 0; i < 3; i++) {
    const cloudX = w * 0.2 + i * w * 0.25 + Math.sin(t * 0.3 + i * 2) * 20
    const cloudY = h * 0.15 + i * 15
    const cloudSize = 30 + i * 8
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.arc(cloudX, cloudY, cloudSize * 0.6, 0, Math.PI * 2)
    ctx.arc(cloudX + cloudSize * 0.4, cloudY - 5, cloudSize * 0.5, 0, Math.PI * 2)
    ctx.arc(cloudX + cloudSize * 0.8, cloudY, cloudSize * 0.55, 0, Math.PI * 2)
    ctx.fill()
  }

  // Water drops animation
  const spawnRate = temp * 3
  if (Math.random() < spawnRate * 0.05) {
    const phase = Math.random() < 0.4 ? 0 : Math.random() < 0.6 ? 1 : 2
    waterDrops.push({
      x: Math.random() * w,
      y: phase === 0 ? h * 0.56 : phase === 1 ? h * 0.15 : h * 0.2,
      vy: phase === 0 ? -0.5 - Math.random() * 0.5 : phase === 2 ? 1 + Math.random() * 2 : 0.2,
      size: 2 + Math.random() * 2,
      opacity: 0.6 + Math.random() * 0.4,
      phase,
    })
  }

  waterDrops = waterDrops.filter(d => {
    d.y += d.vy
    if (d.phase === 0) d.opacity -= 0.003 // Evaporating - fade out
    if (d.phase === 2) d.x += Math.sin(t + d.y * 0.1) * 0.5 // Rain - slight wind

    if (d.phase === 0 && d.y < h * 0.15) return false
    if (d.phase === 2 && d.y > h * 0.56) return false

    ctx.globalAlpha = d.opacity
    if (d.phase === 0) {
      // Water vapor - small dots going up
      ctx.fillStyle = '#90CAF9'
      ctx.beginPath(); ctx.arc(d.x, d.y, d.size * 0.5, 0, Math.PI * 2); ctx.fill()
    } else if (d.phase === 1) {
      // Cloud condensation
      ctx.fillStyle = '#E3F2FD'
      ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill()
    } else {
      // Rain drops
      ctx.fillStyle = '#1E88E5'
      ctx.beginPath()
      ctx.ellipse(d.x, d.y, d.size * 0.5, d.size, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    return true
  })

  // Keep drops manageable
  if (waterDrops.length > 100) waterDrops = waterDrops.slice(-80)

  // Labels with arrows
  const labels = [
    { text: '蒸发', x: w * 0.3, y: h * 0.45, color: '#1E88E5' },
    { text: '水汽输送', x: w * 0.5, y: h * 0.1, color: '#42A5F5' },
    { text: '凝结', x: w * 0.55, y: h * 0.2, color: '#90CAF9' },
    { text: '降水', x: w * 0.65, y: h * 0.35, color: '#1565C0' },
    { text: '地表径流', x: w * 0.2, y: h * 0.65, color: '#0D47A1' },
    { text: '下渗', x: w * 0.35, y: h * 0.75, color: '#5D4037' },
  ]

  ctx.font = 'bold 11px sans-serif'
  labels.forEach(l => {
    ctx.fillStyle = l.color
    ctx.textAlign = 'center'
    ctx.fillText(l.text, l.x, l.y)
  })

  // Title
  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('水循环过程', w / 2, 24)

  // Equation
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('蒸发 → 水汽输送 → 凝结 → 降水 → 径流/下渗 → 蒸发', w / 2, h - 12)
}

/* ───────── 4. Atmospheric Circulation (大气环流) ───────── */

function drawAtmosphere(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  drawBg(ctx, w, h, '#E8EAF6')

  const cx = w / 2
  const cy = h / 2

  ctx.fillStyle = '#2C2824'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('大气环流与气压带风带', w / 2, 30)

  // Earth cross-section (circle)
  const earthR = Math.min(w, h) * 0.28
  const earthGrad = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, earthR)
  earthGrad.addColorStop(0, '#4FC3F7')
  earthGrad.addColorStop(0.6, '#1E88E5')
  earthGrad.addColorStop(1, '#0D47A1')
  ctx.fillStyle = earthGrad
  ctx.beginPath(); ctx.arc(cx, cy, earthR, 0, Math.PI * 2); ctx.fill()

  // Continents on cross-section
  ctx.fillStyle = '#4CAF50'
  ctx.beginPath()
  ctx.ellipse(cx - 20, cy - 30, 25, 15, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 30, cy + 20, 20, 12, 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Latitude lines
  const latitudes = [
    { name: '赤道', angle: 0, color: '#C45D3E' },
    { name: '30°N', angle: -30, color: '#D4A853' },
    { name: '30°S', angle: 30, color: '#D4A853' },
    { name: '60°N', angle: -60, color: '#4A7C59' },
    { name: '60°S', angle: 60, color: '#4A7C59' },
    { name: '极地', angle: -85, color: '#8B5CF6' },
  ]

  latitudes.forEach(lat => {
    const rad = lat.angle * Math.PI / 180
    const ly = cy + Math.sin(rad) * earthR * 0.9
    const lw = Math.cos(rad) * earthR * 0.9 * 2

    if (lw > 10) {
      ctx.strokeStyle = lat.color + '60'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(cx, ly, lw / 2, 3, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Label
      ctx.fillStyle = lat.color
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(lat.name, cx + lw / 2 + 5, ly + 3)
    }
  })

  // Pressure belts
  const pressureBelts = [
    { name: '赤道低压', y: cy, color: '#C45D3E', type: 'low' },
    { name: '副热带高压', y: cy - earthR * 0.5, color: '#D4A853', type: 'high' },
    { name: '副热带高压', y: cy + earthR * 0.5, color: '#D4A853', type: 'high' },
    { name: '副极地低压', y: cy - earthR * 0.8, color: '#4A7C59', type: 'low' },
    { name: '副极地低压', y: cy + earthR * 0.8, color: '#4A7C59', type: 'low' },
  ]

  pressureBelts.forEach(belt => {
    const pulse = Math.sin(t * 2) * 0.15 + 0.85
    ctx.fillStyle = belt.color + Math.round(40 * pulse).toString(16).padStart(2, '0')
    ctx.beginPath()
    ctx.ellipse(cx, belt.y, earthR * 0.95, 6, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Wind arrows (trade winds, westerlies, polar easterlies)
  const windPairs = [
    { fromY: cy, toY: cy - earthR * 0.5, label: '信风带', color: '#C45D3E', curve: 0.3 },
    { fromY: cy, toY: cy + earthR * 0.5, label: '信风带', color: '#C45D3E', curve: -0.3 },
    { fromY: cy - earthR * 0.5, toY: cy - earthR * 0.8, label: '西风带', color: '#4A7C59', curve: -0.2 },
    { fromY: cy + earthR * 0.5, toY: cy + earthR * 0.8, label: '西风带', color: '#4A7C59', curve: 0.2 },
  ]

  windPairs.forEach(wind => {
    const midY = (wind.fromY + wind.toY) / 2
    const arrowX = cx + earthR * 0.7 + Math.sin(t * 1.5) * 5

    ctx.strokeStyle = wind.color + '80'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(arrowX, wind.fromY)
    ctx.quadraticCurveTo(arrowX + wind.curve * 30, midY, arrowX, wind.toY)
    ctx.stroke()

    // Arrowhead
    const dir = wind.toY > wind.fromY ? 1 : -1
    ctx.fillStyle = wind.color
    ctx.beginPath()
    ctx.moveTo(arrowX, wind.toY)
    ctx.lineTo(arrowX - 5, wind.toY - dir * 8)
    ctx.lineTo(arrowX + 5, wind.toY - dir * 8)
    ctx.fill()
  })

  // Hadley cell arrows (vertical circulation)
  const cellAlpha = 0.3 + Math.sin(t) * 0.1
  ctx.strokeStyle = `rgba(196,93,62,${cellAlpha})`
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])

  // Rising at equator
  ctx.beginPath()
  ctx.moveTo(cx - earthR * 0.5, cy)
  ctx.lineTo(cx - earthR * 0.5, cy - earthR * 0.5)
  ctx.stroke()

  // Sinking at 30°
  ctx.beginPath()
  ctx.moveTo(cx + earthR * 0.5, cy - earthR * 0.5)
  ctx.lineTo(cx + earthR * 0.5, cy)
  ctx.stroke()

  // Top flow
  ctx.beginPath()
  ctx.moveTo(cx - earthR * 0.5, cy - earthR * 0.5)
  ctx.lineTo(cx + earthR * 0.5, cy - earthR * 0.5)
  ctx.stroke()

  ctx.setLineDash([])

  // Legend
  const lx = 16
  let ly = 55
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'

  const legendItems = [
    ['赤道低压带', '#C45D3E'],
    ['副热带高压带', '#D4A853'],
    ['副极地低压带', '#4A7C59'],
    ['信风带', '#C45D3E'],
    ['西风带', '#4A7C59'],
  ]
  legendItems.forEach(([label, color]) => {
    ctx.fillStyle = color
    ctx.fillRect(lx, ly, 10, 10)
    ctx.fillStyle = '#6B6560'
    ctx.fillText(label as string, lx + 14, ly + 9)
    ly += 18
  })

  // Info
  ctx.fillStyle = '#6B6560'
  ctx.font = '11px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('热力环流: 热上升 → 冷下沉', 16, h - 30)
  ctx.fillText('三圈环流: 哈德莱 / 费雷尔 / 极地', 16, h - 14)
}

/* ───────── Module Registry ──────── */

const modules: GeoDef[] = [
  {
    key: 'earth', name: '地球运动', category: '天文地理',
    formula: '公转周期: 365.25天 · 地轴倾角: 23.5°',
    description: '地球绕太阳公转产生四季变化。由于地轴倾斜23.5°，太阳直射点在南北回归线之间移动，导致不同纬度在不同时间接收到的太阳辐射量不同，形成春、夏、秋、冬四季。春分和秋分时太阳直射赤道，夏至直射北回归线，冬至直射南回归线。',
    code: `// 地球公转与四季
公转周期: 365.25天 (1恒星年)
轨道: 近似椭圆 (近日点1月初)
地轴倾角: 23°26' (黄赤交角)

// 四季成因
太阳直射点移动范围:
  北回归线 23°26'N (夏至)
  南回归线 23°26'S (冬至)
  赤道 0° (春分/秋分)

// 二分二至
春分 3/21: 直射赤道, 昼夜等长
夏至 6/22: 直射北回归线, 北半球昼最长
秋分 9/23: 直射赤道, 昼夜等长
冬至 12/22: 直射南回归线, 北半球昼最短

// 五带划分
热带: 南北回归线之间
北温带: 北回归线~北极圈
南温带: 南回归线~南极圈
北寒带: 北极圈以北
南寒带: 南极圈以南`,
    params: [
      { key: 'speed', label: '公转速度', min: 0.3, max: 3, step: 0.3, default: 1, unit: 'x' },
      { key: 'showSeason', label: '显示节气', min: 0, max: 1, step: 1, default: 1, unit: '' },
    ],
  },
  {
    key: 'plate', name: '板块构造', category: '地质学',
    formula: '六大板块: 亚欧/非洲/印度洋/太平洋/美洲/南极洲',
    description: '板块构造学说认为地球岩石圈由六大板块组成，板块在软流层上缓慢移动。板块边界分为三种类型：离散边界（板块分离，形成大洋中脊）、汇聚边界（板块碰撞，形成山脉/海沟/火山）、转换边界（板块水平错动，产生地震）。',
    code: `// 板块构造学说
岩石圈分为六大板块:
  亚欧板块、非洲板块
  印度洋板块、太平洋板块
  美洲板块、南极洲板块

// 板块边界类型
1. 离散边界 (生长边界)
   → 板块分离, 岩浆上涌
   → 形成: 大洋中脊、裂谷
   例: 东非大裂谷、大西洋中脊

2. 汇聚边界 (消亡边界)
   → 板块碰撞, 俯冲带
   → 形成: 山脉、海沟、火山
   例: 喜马拉雅山、环太平洋火山带

3. 转换边界
   → 水平错动, 地震频发
   例: 圣安德烈亚斯断层

// 驱动力: 地幔对流`,
    params: [
      { key: 'viewMode', label: '视图模式', min: 0, max: 1, step: 1, default: 0, unit: '' },
      { key: 'boundaryType', label: '边界类型', min: 0, max: 2, step: 1, default: 0, unit: '' },
    ],
  },
  {
    key: 'water', name: '水循环', category: '水文学',
    formula: '蒸发 → 水汽输送 → 凝结 → 降水 → 径流/下渗',
    description: '水循环是地球上水在大气圈、水圈、岩石圈和生物圈之间连续运动的过程。太阳能驱动水从海洋和陆地蒸发，水汽在大气中输送并凝结成云，最终以降水形式返回地表，通过地表径流和地下径流回到海洋，完成循环。',
    code: `// 水循环类型
1. 海陆间循环 (大循环)
   海洋蒸发 → 水汽输送 → 陆地降水
   → 地表/地下径流 → 海洋

2. 陆地内循环
   陆地蒸发/蒸腾 → 陆地降水

3. 海上内循环
   海洋蒸发 → 海洋降水

// 主要环节
蒸发 (太阳能驱动)
水汽输送 (大气环流)
凝结 (降温/凝结核)
降水 (雨/雪/雹)
地表径流 (河流/湖泊)
下渗 (地下水补给)

// 影响因素
气温、风速、湿度、地形、植被`,
    params: [
      { key: 'temp', label: '温度/蒸发强度', min: 0.2, max: 1, step: 0.1, default: 0.6, unit: '' },
    ],
  },
  {
    key: 'atmosphere', name: '大气环流', category: '气象学',
    formula: '三圈环流: 哈德莱环流 / 费雷尔环流 / 极地环流',
    description: '大气环流是全球性有规律的大气运动。由于太阳辐射的纬度差异和地球自转（科里奥利力），形成了三圈环流和七个气压带、六个风带。气压带和风带的季节性移动影响全球气候分布，是理解气候类型的关键。',
    code: `// 三圈环流
1. 哈德莱环流 (低纬)
   赤道上升 → 高空向极地 → 30°下沉
   地面: 信风带 (东北/东南信风)

2. 费雷尔环流 (中纬)
   30°上升 → 高空向极地 → 60°下沉
   地面: 西风带 (西南/西北风)

3. 极地环流 (高纬)
   极地下沉 → 地面向低纬 → 60°上升
   地面: 极地东风带

// 七压六风
气压带: 赤道低压, 副热带高压(×2)
        副极地低压(×2), 极地高压(×2)
风带: 信风带(×2), 西风带(×2), 极地东风带(×2)

// 季节性移动
夏季北移, 冬季南移 (约5-10纬度)`,
    params: [],
  },
]

/* ──────── Component ───────── */

export default function GeographyDemo() {
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

  const initParams = useCallback((mod: GeoDef) => {
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
      earth: drawEarthMotion,
      plate: drawPlateTectonics,
      water: drawWaterCycle,
      atmosphere: drawAtmosphere,
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

  const handleModuleChange = (mod: GeoDef) => {
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

  const boundaryNames = ['离散边界', '汇聚边界', '转换边界']

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          地理知识可视化
        </div>
        <Title level={3} style={{ margin: 0 }}>地理知识演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过动态图形理解地球科学核心概念。从宇宙尺度的地球运动到微观的水循环过程，用动画揭示自然地理的运行规律。
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
            <EnvironmentOutlined style={{ marginRight: 6 }} />
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
            <EnvironmentOutlined style={{ marginRight: 6 }} />知识要点
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
      {selectedModule.params.length > 0 && (
        <div style={{
          padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 8,
          border: '1px solid var(--border)', marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 16, letterSpacing: '0.05em' }}>
            参数调节
          </div>
          {selectedModule.params.map((pd) => (
            <div key={pd.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ width: 120, fontSize: 13 }}>{pd.label}</Text>
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
          {selectedModule.key === 'plate' && params.viewMode === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Text style={{ width: 120, fontSize: 13 }}>边界类型</Text>
              {boundaryNames.map((name, i) => (
                <Button
                  key={i} size="small"
                  type={params.boundaryType === i ? 'primary' : 'default'}
                  onClick={() => handleParamChange('boundaryType', i)}
                  style={params.boundaryType === i ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
                >
                  {name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

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
