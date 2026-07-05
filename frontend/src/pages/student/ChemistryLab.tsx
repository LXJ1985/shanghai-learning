import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Types ───────── */

interface ExpDef {
  key: string
  name: string
  category: string
  equation: string
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

function pHToColor(pH: number): string {
  if (pH <= 1) return '#FF1744'
  if (pH <= 3) return '#FF5252'
  if (pH <= 5) return '#FF9100'
  if (pH <= 6) return '#FFD600'
  if (pH <= 7) return '#76FF03'
  if (pH <= 8) return '#00E5FF'
  if (pH <= 10) return '#2979FF'
  if (pH <= 12) return '#651FFF'
  return '#D500F9'
}

/* ───────── Experiment 1: Acid-Base Titration (酸碱滴定) ───────── */

function drawTitration(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const concentration = params.concentration
  const dropRate = params.dropRate
  const initialPH = params.initialPH
  const volume = params.volume

  const progress = Math.min(t * dropRate * 0.02, 1)
  const currentPH = initialPH + (7 - initialPH) * progress + (progress > 0.95 ? (progress - 0.95) * 20 * (initialPH < 7 ? 1 : -1) : 0)
  const clampedPH = Math.max(0, Math.min(14, currentPH))
  const solColor = pHToColor(clampedPH)

  // Background
  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)

  // Burette (滴定管)
  const burX = w / 2 - 12
  const burTop = 30
  const burH = 140
  const burW = 24
  const liquidLevel = burTop + burH * (1 - progress)

  // Burette body
  ctx.fillStyle = 'rgba(200,220,240,0.3)'
  ctx.fillRect(burX, burTop, burW, burH)
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1.5
  ctx.strokeRect(burX, burTop, burW, burH)

  // Burette liquid
  ctx.fillStyle = 'rgba(196,93,62,0.6)'
  ctx.fillRect(burX + 1, liquidLevel, burW - 2, burTop + burH - liquidLevel)

  // Scale marks
  ctx.fillStyle = '#9C9590'
  ctx.font = '9px monospace'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = burTop + (burH / 5) * i
    ctx.fillRect(burX - 6, y, 6, 1)
    ctx.fillText(`${i * (volume / 5)}`, burX - 8, y + 3)
  }

  // Drip animation
  if (progress < 1) {
    const dripPhase = (t * 3) % 1
    const dripY = burTop + burH + dripPhase * 40
    const dripSize = 3 + (1 - dripPhase) * 2
    ctx.fillStyle = 'rgba(196,93,62,0.7)'
    ctx.beginPath()
    ctx.ellipse(w / 2, dripY, dripSize * 0.6, dripSize, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Erlenmeyer flask (锥形瓶)
  const flaskCX = w / 2
  const flaskTop = burTop + burH + 50
  const flaskH = 120
  const flaskBottomW = 90
  const flaskNeckW = 20

  // Flask outline
  ctx.beginPath()
  ctx.moveTo(flaskCX - flaskNeckW / 2, flaskTop)
  ctx.lineTo(flaskCX - flaskNeckW / 2, flaskTop + 20)
  ctx.lineTo(flaskCX - flaskBottomW / 2, flaskTop + flaskH)
  ctx.lineTo(flaskCX + flaskBottomW / 2, flaskTop + flaskH)
  ctx.lineTo(flaskCX + flaskNeckW / 2, flaskTop + 20)
  ctx.lineTo(flaskCX + flaskNeckW / 2, flaskTop)
  ctx.closePath()
  ctx.fillStyle = 'rgba(200,220,240,0.15)'
  ctx.fill()
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Solution in flask
  const solTop = flaskTop + flaskH * 0.35
  const solLeftX = flaskCX - flaskNeckW / 2 - (flaskBottomW / 2 - flaskNeckW / 2) * ((solTop - flaskTop - 20) / (flaskH - 20))
  const solRightX = flaskCX + flaskNeckW / 2 + (flaskBottomW / 2 - flaskNeckW / 2) * ((solTop - flaskTop - 20) / (flaskH - 20))
  const botLeft = flaskCX - flaskBottomW / 2
  const botRight = flaskCX + flaskBottomW / 2

  ctx.beginPath()
  ctx.moveTo(solLeftX, solTop)
  ctx.lineTo(botLeft, flaskTop + flaskH)
  ctx.lineTo(botRight, flaskTop + flaskH)
  ctx.lineTo(solRightX, solTop)
  ctx.closePath()
  ctx.fillStyle = solColor + '88'
  ctx.fill()

  // Swirl effect
  const swirlAngle = t * 2
  ctx.save()
  ctx.globalAlpha = 0.15
  for (let i = 0; i < 3; i++) {
    const sx = flaskCX + Math.cos(swirlAngle + i * 2.1) * 15
    const sy = flaskTop + flaskH * 0.65 + Math.sin(swirlAngle + i * 2.1) * 8
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(sx, sy, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // pH meter display
  const meterX = w - 140
  const meterY = 40
  ctx.fillStyle = '#1E1E1E'
  ctx.fillRect(meterX, meterY, 120, 60)
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.strokeRect(meterX, meterY, 120, 60)
  ctx.fillStyle = solColor
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`pH ${clampedPH.toFixed(1)}`, meterX + 60, meterY + 40)

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  const addedVol = (progress * volume).toFixed(1)
  ctx.fillText(`已加液: ${addedVol}mL`, 16, 24)
  ctx.fillText(`浓度: ${concentration}mol/L`, 16, 42)
  ctx.fillText(`当前pH: ${clampedPH.toFixed(2)}`, 16, 60)
  ctx.fillText(progress >= 1 ? '状态: 滴定完成' : '状态: 滴定中...', 16, 78)

  return progress < 1
}

/* ───────── Experiment 2: Electrolysis of Water (电解水) ───────── */

interface Bubble { x: number; y: number; r: number; speed: number; tube: 'H' | 'O' }

let bubbles: Bubble[] = []

function drawElectrolysis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const voltage = params.voltage
  const temperature = params.temperature

  const baseY = h - 60
  const containerW = w - 80
  const containerH = 180
  const containerX = 40
  const containerY = baseY - containerH

  // Background
  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)

  // Water container
  ctx.fillStyle = 'rgba(100,180,255,0.1)'
  ctx.fillRect(containerX, containerY, containerW, containerH)
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 2
  ctx.strokeRect(containerX, containerY, containerW, containerH)

  // Water
  const waterTop = containerY + 20
  ctx.fillStyle = 'rgba(100,180,255,0.15)'
  ctx.fillRect(containerX + 1, waterTop, containerW - 2, containerH - 21)

  // Collection tubes
  const tubeW = 50
  const tubeH = 120
  const h2TubeX = containerX + containerW * 0.25 - tubeW / 2
  const o2TubeX = containerX + containerW * 0.75 - tubeW / 2
  const tubeTop = containerY - 10

  // H2 tube (left, larger - 2:1 ratio)
  const h2Progress = Math.min(t * voltage * 0.015, 1)
  const h2Level = tubeTop + tubeH * (1 - h2Progress)
  ctx.fillStyle = 'rgba(200,220,240,0.2)'
  ctx.fillRect(h2TubeX, tubeTop, tubeW, tubeH)
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1.5
  ctx.strokeRect(h2TubeX, tubeTop, tubeW, tubeH)

  // H2 gas
  ctx.fillStyle = 'rgba(100,200,255,0.2)'
  ctx.fillRect(h2TubeX + 1, h2Level, tubeW - 2, tubeTop + tubeH - h2Level)
  ctx.fillStyle = '#4A7C59'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('H₂', h2TubeX + tubeW / 2, tubeTop + tubeH + 16)
  ctx.font = '10px monospace'
  ctx.fillText(`${(h2Progress * 40).toFixed(0)}mL`, h2TubeX + tubeW / 2, tubeTop + tubeH + 30)

  // O2 tube (right, smaller)
  const o2Progress = Math.min(t * voltage * 0.0075, 1)
  const o2Level = tubeTop + tubeH * (1 - o2Progress)
  ctx.fillStyle = 'rgba(200,220,240,0.2)'
  ctx.fillRect(o2TubeX, tubeTop, tubeW, tubeH)
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1.5
  ctx.strokeRect(o2TubeX, tubeTop, tubeW, tubeH)

  // O2 gas
  ctx.fillStyle = 'rgba(255,150,100,0.2)'
  ctx.fillRect(o2TubeX + 1, o2Level, tubeW - 2, tubeTop + tubeH - o2Level)
  ctx.fillStyle = '#C45D3E'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('O₂', o2TubeX + tubeW / 2, tubeTop + tubeH + 16)
  ctx.font = '10px monospace'
  ctx.fillText(`${(o2Progress * 20).toFixed(0)}mL`, o2TubeX + tubeW / 2, tubeTop + tubeH + 30)

  // Electrodes
  const electrodeW = 8
  const cathodeX = h2TubeX + tubeW / 2
  const anodeX = o2TubeX + tubeW / 2
  const electrodeTop = waterTop + 10
  const electrodeBottom = baseY - 10

  // Cathode (-)
  ctx.fillStyle = '#555'
  ctx.fillRect(cathodeX - electrodeW / 2, electrodeTop, electrodeW, electrodeBottom - electrodeTop)
  ctx.fillStyle = '#C45D3E'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('−', cathodeX, electrodeTop - 6)

  // Anode (+)
  ctx.fillStyle = '#555'
  ctx.fillRect(anodeX - electrodeW / 2, electrodeTop, electrodeW, electrodeBottom - electrodeTop)
  ctx.fillStyle = '#4A7C59'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText('+', anodeX, electrodeTop - 6)

  // Bubbles
  if (t > 0.5) {
    const bubbleRate = voltage * (temperature / 25) * 0.3
    if (Math.random() < bubbleRate * 0.1) {
      bubbles.push({
        x: cathodeX + (Math.random() - 0.5) * 16,
        y: electrodeBottom - 10,
        r: 1.5 + Math.random() * 2.5,
        speed: 0.5 + Math.random() * 1,
        tube: 'H',
      })
    }
    if (Math.random() < bubbleRate * 0.05) {
      bubbles.push({
        x: anodeX + (Math.random() - 0.5) * 16,
        y: electrodeBottom - 10,
        r: 1.5 + Math.random() * 2.5,
        speed: 0.4 + Math.random() * 0.8,
        tube: 'O',
      })
    }
  }

  // Update & draw bubbles
  bubbles = bubbles.filter(b => b.y > tubeTop + 5)
  bubbles.forEach(b => {
    b.y -= b.speed
    b.x += (Math.random() - 0.5) * 0.5
    ctx.fillStyle = b.tube === 'H' ? 'rgba(100,200,255,0.5)' : 'rgba(255,150,100,0.5)'
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
  })
  if (bubbles.length > 200) bubbles = bubbles.slice(-150)

  // Electric spark effect
  if (voltage > 5) {
    ctx.save()
    ctx.globalAlpha = 0.3 + Math.sin(t * 20) * 0.2
    ctx.strokeStyle = '#FFD600'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cathodeX, electrodeTop + 20)
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(cathodeX + (Math.random() - 0.5) * 8, electrodeTop + 20 + i * 15)
    }
    ctx.stroke()
    ctx.restore()
  }

  // Battery symbol
  const batX = w / 2 - 30
  const batY = baseY + 10
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(batX, batY); ctx.lineTo(batX + 20, batY)
  ctx.moveTo(batX + 25, batY - 6); ctx.lineTo(batX + 25, batY + 6)
  ctx.moveTo(batX + 30, batY - 3); ctx.lineTo(batX + 30, batY + 3)
  ctx.moveTo(batX + 35, batY - 6); ctx.lineTo(batX + 35, batY + 6)
  ctx.moveTo(batX + 40, batY); ctx.lineTo(batX + 60, batY)
  ctx.stroke()
  ctx.fillStyle = '#6B6560'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${voltage}V`, batX + 30, batY + 20)

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`电压: ${voltage}V`, 16, 24)
  ctx.fillText(`温度: ${temperature}°C`, 16, 42)
  ctx.fillText(`H₂:O₂ = 2:1`, 16, 60)
  ctx.fillText(`时间: ${t.toFixed(1)}s`, 16, 78)

  return h2Progress < 1 && o2Progress < 1
}

/* ───────── Experiment 3: Reaction Rate (化学反应速率) ───────── */

interface Particle { x: number; y: number; vx: number; vy: number; type: 'A' | 'B' | 'C'; r: number }

let particles: Particle[] = []

function drawReactionRate(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const temperature = params.temperature
  const concentration = params.concentration
  const catalyst = params.catalyst

  const reactAreaX = 40
  const reactAreaY = 40
  const reactAreaW = w - 80
  const reactAreaH = h - 80

  // Background
  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)

  // Reaction vessel
  ctx.fillStyle = 'rgba(240,235,228,0.5)'
  ctx.fillRect(reactAreaX, reactAreaY, reactAreaW, reactAreaH)
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 2
  ctx.strokeRect(reactAreaX, reactAreaY, reactAreaW, reactAreaH)

  // Init particles
  if (particles.length === 0 || t < 0.1) {
    particles = []
    const countA = Math.round(concentration * 3)
    const countB = Math.round(concentration * 3)
    for (let i = 0; i < countA; i++) {
      particles.push({
        x: reactAreaX + 20 + Math.random() * (reactAreaW - 40),
        y: reactAreaY + 20 + Math.random() * (reactAreaH - 40),
        vx: (Math.random() - 0.5) * temperature * 0.3,
        vy: (Math.random() - 0.5) * temperature * 0.3,
        type: 'A', r: 8,
      })
    }
    for (let i = 0; i < countB; i++) {
      particles.push({
        x: reactAreaX + 20 + Math.random() * (reactAreaW - 40),
        y: reactAreaY + 20 + Math.random() * (reactAreaH - 40),
        vx: (Math.random() - 0.5) * temperature * 0.3,
        vy: (Math.random() - 0.5) * temperature * 0.3,
        type: 'B', r: 8,
      })
    }
  }

  const speedFactor = temperature / 25
  const collisionDist = 18

  // Update particles
  particles.forEach(p => {
    p.x += p.vx * speedFactor * 0.5
    p.y += p.vy * speedFactor * 0.5

    // Bounce off walls
    if (p.x - p.r < reactAreaX || p.x + p.r > reactAreaX + reactAreaW) { p.vx *= -1; p.x = Math.max(reactAreaX + p.r, Math.min(reactAreaX + reactAreaW - p.r, p.x)) }
    if (p.y - p.r < reactAreaY || p.y + p.r > reactAreaY + reactAreaH) { p.vy *= -1; p.y = Math.max(reactAreaY + p.r, Math.min(reactAreaY + reactAreaH - p.r, p.y)) }
  })

  // Check collisions A+B -> C
  const reactionProb = catalyst > 0 ? 0.08 : 0.03
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j]
      if (a.type === 'C' || b.type === 'C') continue
      if (a.type === b.type) continue
      const dx = a.x - b.x, dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < collisionDist && Math.random() < reactionProb) {
        a.type = 'C'; a.r = 10
        particles.splice(j, 1)
      }
    }
  }

  // Draw particles
  const colors: Record<string, string> = { A: '#C45D3E', B: '#4A7C59', C: '#D4A853' }
  const labels: Record<string, string> = { A: 'A', B: 'B', C: 'AB' }

  particles.forEach(p => {
    // Glow
    ctx.fillStyle = colors[p.type] + '30'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.fillStyle = colors[p.type]
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()

    // Label
    ctx.fillStyle = '#FFF'
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(labels[p.type], p.x, p.y + 3)
  })

  // Collision flash
  if (t > 0) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j]
        const dx = a.x - b.x, dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < collisionDist + 5 && a.type !== b.type && a.type !== 'C' && b.type !== 'C') {
          ctx.fillStyle = 'rgba(255,215,0,0.3)'
          ctx.beginPath()
          ctx.arc((a.x + b.x) / 2, (a.y + b.y) / 2, 12, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // Catalyst indicator
  if (catalyst > 0) {
    ctx.fillStyle = 'rgba(139,92,246,0.1)'
    ctx.fillRect(reactAreaX, reactAreaY, reactAreaW, reactAreaH)
    ctx.fillStyle = '#8B5CF6'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('⚡ 催化剂活化', reactAreaX + reactAreaW - 8, reactAreaY + 16)
  }

  // Counts
  const countA = particles.filter(p => p.type === 'A').length
  const countB = particles.filter(p => p.type === 'B').length
  const countC = particles.filter(p => p.type === 'C').length

  // Legend
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  const legendY = reactAreaY + reactAreaH + 20
  ;[['A', '#C45D3E'], ['B', '#4A7C59'], ['AB', '#D4A853']].forEach(([label, color], i) => {
    const lx = reactAreaX + i * 80
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(lx + 6, legendY, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#6B6560'
    ctx.fillText(label, lx + 16, legendY + 4)
  })

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`反应物A: ${countA}`, 16, 24)
  ctx.fillText(`反应物B: ${countB}`, 16, 42)
  ctx.fillText(`生成物AB: ${countC}`, 16, 60)
  ctx.fillText(`温度: ${temperature}°C`, 16, 78)

  return true
}

/* ───────── Experiment 4: Flame Test (焰色反应) ───────── */

function drawFlameTest(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const element = Math.round(params.element) // 0=Li, 1=Na, 2=K, 3=Cu, 4=Ca

  const elements = [
    { name: '锂 Li', color: '#FF1744', colorName: '洋红', wavelength: '670.8nm' },
    { name: '钠 Na', color: '#FFD600', colorName: '金黄', wavelength: '589.3nm' },
    { name: '钾 K', color: '#AA00FF', colorName: '浅紫', wavelength: '766.5nm' },
    { name: '铜 Cu', color: '#00E676', colorName: '翠绿', wavelength: '510.5nm' },
    { name: '钙 Ca', color: '#FF6D00', colorName: '砖红', wavelength: '622.0nm' },
  ]

  const el = elements[element]
  const groundY = h - 60

  // Background (dark for better flame visibility)
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#1A1A2E')
  gradient.addColorStop(1, '#16213E')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Bunsen burner base
  const burnerX = w / 2
  const burnerTop = groundY - 100

  ctx.fillStyle = '#444'
  ctx.fillRect(burnerX - 25, groundY - 20, 50, 20)
  ctx.fillRect(burnerX - 8, burnerTop + 20, 16, groundY - burnerTop - 40)

  // Burner top
  ctx.fillStyle = '#555'
  ctx.fillRect(burnerX - 15, burnerTop + 10, 30, 15)

  // Flame
  const flameH = 70 + Math.sin(t * 8) * 5
  const flameW = 20 + Math.sin(t * 6) * 3

  // Outer glow
  const glowGrad = ctx.createRadialGradient(burnerX, burnerTop - flameH * 0.3, 0, burnerX, burnerTop - flameH * 0.3, flameH * 0.8)
  glowGrad.addColorStop(0, el.color + '40')
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.fillRect(burnerX - flameH, burnerTop - flameH, flameH * 2, flameH * 1.5)

  // Flame body
  for (let layer = 3; layer >= 0; layer--) {
    const layerScale = 1 - layer * 0.15
    const layerAlpha = layer === 0 ? 0.9 : 0.3 + layer * 0.15
    const wobble = Math.sin(t * 10 + layer) * 3

    ctx.save()
    ctx.globalAlpha = layerAlpha
    ctx.fillStyle = layer === 0 ? '#FFFFFF' : el.color

    ctx.beginPath()
    ctx.moveTo(burnerX - flameW * layerScale + wobble, burnerTop + 10)
    ctx.quadraticCurveTo(
      burnerX - flameW * 1.3 * layerScale + wobble * 2,
      burnerTop - flameH * 0.4 * layerScale,
      burnerX + wobble * 1.5,
      burnerTop - flameH * layerScale
    )
    ctx.quadraticCurveTo(
      burnerX + flameW * 1.3 * layerScale + wobble * 2,
      burnerTop - flameH * 0.4 * layerScale,
      burnerX + flameW * layerScale + wobble,
      burnerTop + 10
    )
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Spark particles
  for (let i = 0; i < 8; i++) {
    const sparkT = (t * 2 + i * 0.7) % 3
    if (sparkT < 2) {
      const sx = burnerX + Math.sin(t * 5 + i * 1.3) * 15
      const sy = burnerTop - flameH * 0.5 - sparkT * 20
      const sr = 1.5 * (1 - sparkT / 2)
      ctx.fillStyle = el.color
      ctx.globalAlpha = 1 - sparkT / 2
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  // Ground
  ctx.fillStyle = '#2A2A3E'
  ctx.fillRect(0, groundY, w, h - groundY)

  // Element info panel
  const panelX = 20
  const panelY = 20
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(panelX, panelY, 180, 100)
  ctx.strokeStyle = el.color
  ctx.lineWidth = 1
  ctx.strokeRect(panelX, panelY, 180, 100)

  ctx.fillStyle = el.color
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(el.name, panelX + 12, panelY + 28)

  ctx.fillStyle = '#CCC'
  ctx.font = '12px sans-serif'
  ctx.fillText(`焰色: ${el.colorName}`, panelX + 12, panelY + 52)
  ctx.fillText(`波长: ${el.wavelength}`, panelX + 12, panelY + 72)
  ctx.fillText(`元素序号: ${element + 1}/5`, panelX + 12, panelY + 92)

  // Spectrum bar
  const specX = w - 200
  const specY = 30
  const specW = 170
  const specH = 24
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(specX, specY, specW, specH + 20)
  const specGrad = ctx.createLinearGradient(specX, 0, specX + specW, 0)
  specGrad.addColorStop(0, '#FF1744'); specGrad.addColorStop(0.2, '#FF9100')
  specGrad.addColorStop(0.4, '#FFD600'); specGrad.addColorStop(0.55, '#76FF03')
  specGrad.addColorStop(0.7, '#00E5FF'); specGrad.addColorStop(0.85, '#2979FF')
  specGrad.addColorStop(1, '#AA00FF')
  ctx.fillStyle = specGrad
  ctx.fillRect(specX + 5, specY + 5, specW - 10, specH)

  // Marker for current element
  const markerPos = specX + 5 + (element / 4) * (specW - 10)
  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.moveTo(markerPos, specY + specH + 8)
  ctx.lineTo(markerPos - 4, specY + specH + 14)
  ctx.lineTo(markerPos + 4, specY + specH + 14)
  ctx.closePath()
  ctx.fill()

  // Data
  ctx.fillStyle = '#AAA'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`时间: ${t.toFixed(1)}s`, 16, h - 20)

  return true
}

/* ───────── Experiment Registry ───────── */

const experiments: ExpDef[] = [
  {
    key: 'titration', name: '酸碱滴定', category: '分析化学',
    equation: 'HCl + NaOH → NaCl + H₂O',
    description: '酸碱滴定是定量分析的重要方法。通过逐滴加入标准溶液，利用指示剂颜色变化判断滴定终点，从而测定未知溶液的浓度。pH值实时变化，终点附近pH突变。',
    code: `// 酸碱中和反应
HCl + NaOH → NaCl + H₂O

// pH 计算
pH = -log[H⁺]

// 滴定方程
C₁V₁ = C₂V₂

// 指示剂变色范围
酚酞: pH 8.2~10.0 (无色→粉红)
甲基橙: pH 3.1~4.4 (红→黄)

// 终点判断
ΔpH/ΔV → max 时为滴定终点`,
    params: [
      { key: 'concentration', label: '标准液浓度', min: 0.1, max: 2, step: 0.1, default: 0.5, unit: 'mol/L' },
      { key: 'dropRate', label: '滴加速率', min: 1, max: 10, step: 1, default: 3, unit: '滴/s' },
      { key: 'initialPH', label: '初始pH', min: 1, max: 6, step: 1, default: 2, unit: '' },
      { key: 'volume', label: '滴定体积', min: 10, max: 50, step: 5, default: 25, unit: 'mL' },
    ],
  },
  {
    key: 'electrolysis', name: '电解水', category: '电化学',
    equation: '2H₂O → 2H₂↑ + O₂↑',
    description: '电解水实验证明水由氢和氧组成。通电后，阴极产生氢气，阳极产生氧气，体积比为2:1。电压越高、温度越高，反应速率越快。',
    code: `// 电解水总反应
2H₂O → 2H₂↑ + O₂↑

// 阴极反应（还原）
2H₂O + 2e⁻ → H₂ + 2OH⁻

// 阳极反应（氧化）
2H₂O → O₂ + 4H⁺ + 4e⁻

// 法拉第定律
m = M·I·t / (n·F)
F = 96485 C/mol

// 气体体积比
V(H₂) : V(O₂) = 2 : 1`,
    params: [
      { key: 'voltage', label: '电压', min: 3, max: 24, step: 1, default: 12, unit: 'V' },
      { key: 'temperature', label: '水温', min: 5, max: 80, step: 5, default: 25, unit: '°C' },
    ],
  },
  {
    key: 'reaction', name: '反应速率', category: '化学动力学',
    equation: 'A + B → AB',
    description: '化学反应速率受温度、浓度和催化剂影响。温度升高使粒子运动加快，碰撞频率增加；浓度增大增加有效碰撞概率；催化剂降低活化能，加速反应。',
    code: `// 反应速率方程
v = k·[A]^m·[B]^n

// 阿伦尼乌斯方程
k = A·e^(-Ea/RT)

// 影响因素
温度↑ → 速率↑ (粒子动能增大)
浓度↑ → 速率↑ (碰撞频率增大)
催化剂 → 速率↑ (降低活化能)

// 有效碰撞条件
1. 足够能量（≥活化能）
2. 正确取向`,
    params: [
      { key: 'temperature', label: '温度', min: 10, max: 80, step: 5, default: 25, unit: '°C' },
      { key: 'concentration', label: '浓度', min: 3, max: 15, step: 1, default: 8, unit: 'mol/L' },
      { key: 'catalyst', label: '催化剂', min: 0, max: 1, step: 1, default: 0, unit: '' },
    ],
  },
  {
    key: 'flame', name: '焰色反应', category: '定性分析',
    equation: '金属离子 → 特征光谱',
    description: '不同金属元素在火焰中会呈现特征颜色，这是因为电子受热激发到高能级，跃迁回低能级时释放特定波长的光。此方法用于元素的定性鉴定。',
    code: `// 焰色反应原理
电子受热激发: M → M* (激发态)
跃迁回基态: M* → M + hν (光子)

// 特征波长
E = hν = hc/λ

// 常见元素焰色
锂(Li): 洋红  670.8nm
钠(Na): 金黄  589.3nm
钾(K): 浅紫  766.5nm
铜(Cu): 翠绿  510.5nm
钙(Ca): 砖红  622.0nm

// 注意：观察钾需透过蓝色钴玻璃`,
    params: [
      { key: 'element', label: '元素选择', min: 0, max: 4, step: 1, default: 1, unit: '' },
    ],
  },
]

/* ───────── Component ───────── */

export default function ChemistryLab() {
  const [selectedExp, setSelectedExp] = useState(experiments[0])
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    experiments[0].params.forEach((pd) => { p[pd.key] = pd.default })
    return p
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const initParams = useCallback((exp: ExpDef) => {
    const p: Record<string, number> = {}
    exp.params.forEach((pd) => { p[pd.key] = pd.default })
    setParams(p)
    setTime(0)
    setIsPlaying(false)
    bubbles = []
    particles = []
  }, [])

  useEffect(() => { initParams(selectedExp) }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ctx, w, h } = setupCanvas(canvas)

    const drawFn: Record<string, Function> = {
      titration: drawTitration,
      electrolysis: drawElectrolysis,
      reaction: drawReactionRate,
      flame: drawFlameTest,
    }
    drawFn[selectedExp.key]?.(ctx, w, h, time, params)
  }, [selectedExp, time, params])

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

  const handleExpChange = (exp: ExpDef) => {
    setSelectedExp(exp)
    initParams(exp)
  }

  const handleReset = () => {
    setTime(0)
    setIsPlaying(false)
    bubbles = []
    particles = []
  }

  const handleParamChange = (key: string, val: number) => {
    setParams((p) => ({ ...p, [key]: val }))
    setTime(0)
    bubbles = []
    particles = []
  }

  const elementNames = ['锂 Li', '钠 Na', '钾 K', '铜 Cu', '钙 Ca']

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          虚拟化学实验室
        </div>
        <Title level={3} style={{ margin: 0 }}>化学实验演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过动画模拟经典化学实验过程，直观观察反应现象，理解化学原理。支持参数调节探索不同条件。
        </Paragraph>
      </div>

      {/* Experiment selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {experiments.map((exp) => (
          <button
            key={exp.key}
            onClick={() => handleExpChange(exp)}
            style={{
              padding: '8px 18px', borderRadius: 4,
              border: `1px solid ${selectedExp.key === exp.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedExp.key === exp.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedExp.key === exp.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: selectedExp.key === exp.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            <ExperimentOutlined style={{ marginRight: 6 }} />
            {exp.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'rgba(0,0,0,0.04)', color: 'var(--ink-tertiary)',
            }}>
              {exp.category}
            </Tag>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{
          flex: 1, background: 'var(--bg-surface)',
          border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 20px', borderBottom: '1px solid var(--border)',
            background: selectedExp.key === 'flame' ? '#1A1A2E' : 'var(--bg-muted)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{
              fontSize: 13, color: selectedExp.key === 'flame' ? '#AAA' : 'var(--ink-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              {selectedExp.equation}
            </span>
            <span style={{
              fontSize: 11, color: selectedExp.key === 'flame' ? '#888' : 'var(--ink-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}>
              t = {time.toFixed(2)}s
            </span>
          </div>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%', height: 380, display: 'block',
              background: selectedExp.key === 'flame' ? '#1A1A2E' : undefined,
            }}
          />
        </div>

        {/* Code panel */}
        <div style={{
          width: 260, background: '#1E1E1E', borderRadius: 6,
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            padding: '10px 16px', background: '#2D2D2D',
            fontSize: 11, color: '#9C9590', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            化学方程式
          </div>
          <pre style={{
            padding: 16, margin: 0, fontSize: 12, lineHeight: 1.8,
            color: '#D4D4D4', fontFamily: 'var(--font-mono)',
            overflow: 'auto', maxHeight: 420, whiteSpace: 'pre-wrap',
          }}>
            {selectedExp.code}
          </pre>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '16px 24px', display: 'flex',
        alignItems: 'center', gap: 16, marginBottom: 24,
      }}>
        <Button
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          type="primary"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '暂停' : '开始实验'}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        <div style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {isPlaying ? '实验进行中...' : time > 0 ? '已暂停' : '准备就绪'}
        </Text>
      </div>

      {/* Parameter controls */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
        }}>
          实验参数
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedExp.params.map((pd) => (
            <div key={pd.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text style={{ fontSize: 13, color: 'var(--ink-secondary)', width: 90, flexShrink: 0 }}>
                {pd.label}
              </Text>
              {pd.key === 'element' ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {elementNames.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleParamChange(pd.key, idx)}
                      style={{
                        padding: '4px 12px', borderRadius: 4, fontSize: 12,
                        border: `1px solid ${(params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--border)'}`,
                        background: (params[pd.key] ?? pd.default) === idx ? 'var(--accent-soft)' : 'transparent',
                        color: (params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--ink-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : pd.key === 'catalyst' ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  {[{ label: '无', val: 0 }, { label: '有', val: 1 }].map(({ label, val }) => (
                    <button
                      key={val}
                      onClick={() => handleParamChange(pd.key, val)}
                      style={{
                        padding: '4px 16px', borderRadius: 4, fontSize: 12,
                        border: `1px solid ${(params[pd.key] ?? pd.default) === val ? 'var(--accent)' : 'var(--border)'}`,
                        background: (params[pd.key] ?? pd.default) === val ? 'var(--accent-soft)' : 'transparent',
                        color: (params[pd.key] ?? pd.default) === val ? 'var(--accent)' : 'var(--ink-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <Slider
                    min={pd.min} max={pd.max} step={pd.step}
                    value={params[pd.key] ?? pd.default}
                    onChange={(v) => handleParamChange(pd.key, v as number)}
                    style={{ flex: 1 }}
                  />
                  <Text style={{
                    fontSize: 12, color: 'var(--ink-tertiary)',
                    fontFamily: 'var(--font-mono)', width: 64, textAlign: 'right',
                  }}>
                    {params[pd.key] ?? pd.default}{pd.unit}
                  </Text>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 6, padding: 24,
      }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
        }}>
          实验原理
        </div>
        <Title level={4} style={{ marginBottom: 8 }}>{selectedExp.name}</Title>
        <Paragraph style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedExp.description}
        </Paragraph>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Tag color="default">方程式：{selectedExp.equation}</Tag>
          <Tag color="default">类别：{selectedExp.category}</Tag>
        </div>
      </div>
    </div>
  )
}
