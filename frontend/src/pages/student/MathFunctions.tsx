import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  FunctionOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Types ───────── */

interface FuncDef {
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

function drawCoordSystem(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, cy: number, scale: number, showLabels = true) {
  // Grid
  ctx.strokeStyle = '#EDE7E0'
  ctx.lineWidth = 0.5
  const step = scale
  for (let x = cx % step; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = cy % step; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Axes
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()

  // Arrows
  ctx.fillStyle = '#9C9590'
  ctx.beginPath(); ctx.moveTo(w - 2, cy); ctx.lineTo(w - 10, cy - 4); ctx.lineTo(w - 10, cy + 4); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx - 4, 10); ctx.lineTo(cx + 4, 10); ctx.closePath(); ctx.fill()

  if (!showLabels) return

  // Tick labels
  ctx.fillStyle = '#9C9590'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  const unit = scale
  for (let i = -Math.floor(cx / unit); i <= Math.floor((w - cx) / unit); i++) {
    if (i === 0) continue
    const x = cx + i * unit
    ctx.fillText(String(i), x, cy + 14)
    ctx.fillRect(x, cy - 2, 1, 4)
  }
  ctx.textAlign = 'right'
  for (let i = -Math.floor(cy / unit); i <= Math.floor((h - cy) / unit); i++) {
    if (i === 0) continue
    const y = cy + i * unit
    ctx.fillText(String(-i), cx - 6, y + 4)
    ctx.fillRect(cx - 2, y, 4, 1)
  }
  ctx.textAlign = 'right'
  ctx.fillText('O', cx - 6, cy + 14)
  ctx.textAlign = 'left'
  ctx.fillText('x', w - 14, cy - 8)
  ctx.fillText('y', cx + 8, 14)
}

/* ───────── 1. Trigonometric Functions (三角函数) ───────── */

function drawTrig(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const amplitude = params.amplitude
  const frequency = params.frequency
  const phase = params.phase
  const funcType = Math.round(params.funcType) // 0=sin, 1=cos, 2=tan

  const cx = 60
  const cy = h / 2
  const scaleX = 50
  const scaleY = 50
  const drawProgress = Math.min(t * 0.8, 1)

  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)
  drawCoordSystem(ctx, w, h, cx, cy, scaleX)

  // Unit circle on the left
  const ucCx = 30
  const ucCy = cy
  const ucR = 25
  ctx.strokeStyle = '#D0C8BE'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(ucCx, ucCy, ucR, 0, Math.PI * 2); ctx.stroke()

  // Rotating point on unit circle
  const angle = frequency * t * 2 + phase * Math.PI / 180
  const ptX = ucCx + ucR * Math.cos(angle)
  const ptY = ucCy - ucR * Math.sin(angle)

  ctx.fillStyle = '#C45D3E'
  ctx.beginPath(); ctx.arc(ptX, ptY, 4, 0, Math.PI * 2); ctx.fill()

  // Projection line
  const funcs = [
    (a: number) => Math.sin(a),
    (a: number) => Math.cos(a),
    (a: number) => Math.tan(a),
  ]
  const funcNames = ['sin', 'cos', 'tan']
  const funcColors = ['#C45D3E', '#4A7C59', '#8B5CF6']
  const fn = funcs[funcType]
  const color = funcColors[funcType]

  // Projection line from unit circle to curve
  ctx.strokeStyle = color + '40'
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ptX, ptY)
  const curveStartX = cx
  ctx.lineTo(curveStartX, ptY)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw curve
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const xRange = (w - cx - 20) / scaleX
  const drawXRange = xRange * drawProgress
  let first = true

  for (let px = 0; px <= drawXRange * scaleX; px += 1) {
    const xVal = px / scaleX
    const angleVal = frequency * xVal + phase * Math.PI / 180
    let yVal = amplitude * fn(angleVal)

    // Clamp tan
    if (funcType === 2) yVal = Math.max(-3, Math.min(3, yVal))

    const screenX = cx + px
    const screenY = cy - yVal * scaleY

    if (funcType === 2 && Math.abs(yVal) > 2.8) {
      first = true
      continue
    }

    if (first) { ctx.moveTo(screenX, screenY); first = false }
    else ctx.lineTo(screenX, screenY)
  }
  ctx.stroke()

  // Current point on curve
  const currentXVal = (t * 2) % xRange
  const currentAngle = frequency * currentXVal + phase * Math.PI / 180
  let currentY = amplitude * fn(currentAngle)
  if (funcType === 2) currentY = Math.max(-3, Math.min(3, currentY))

  const dotX = cx + currentXVal * scaleX
  const dotY = cy - currentY * scaleY

  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.beginPath(); ctx.arc(dotX, dotY, 2, 0, Math.PI * 2); ctx.fill()

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`y = ${amplitude}${funcNames[funcType]}(${frequency}x + ${phase}°)`, 16, 24)
  ctx.fillText(`当前值: ${currentY.toFixed(3)}`, 16, 42)
  ctx.fillText(`周期: ${(2 * Math.PI / frequency).toFixed(2)}`, 16, 60)
  if (funcType !== 2) ctx.fillText(`值域: [${(-amplitude).toFixed(1)}, ${amplitude.toFixed(1)}]`, 16, 78)

  // Legend
  ctx.font = '11px sans-serif'
  funcNames.forEach((name, i) => {
    const lx = w - 120
    const ly = 20 + i * 18
    ctx.fillStyle = funcColors[i]
    ctx.fillRect(lx, ly - 4, 12, 3)
    ctx.fillStyle = '#6B6560'
    ctx.textAlign = 'left'
    ctx.fillText(name + '(x)', lx + 18, ly)
  })
}

/* ───────── 2. Quadratic Function (二次函数) ───────── */

function drawQuadratic(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const a = params.a
  const b = params.b
  const c = params.c
  const drawProgress = Math.min(t * 0.6, 1)

  const cx = w / 2
  const cy = h * 0.65
  const scale = 35

  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)
  drawCoordSystem(ctx, w, h, cx, cy, scale)

  // Vertex
  const vx = -b / (2 * a)
  const vy = a * vx * vx + b * vx + c

  // Roots
  const disc = b * b - 4 * a * c
  const roots: number[] = []
  if (disc >= 0) {
    roots.push((-b + Math.sqrt(disc)) / (2 * a))
    if (disc > 0) roots.push((-b - Math.sqrt(disc)) / (2 * a))
  }

  // Draw parabola
  ctx.strokeStyle = '#C45D3E'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const xMin = -(cx) / scale
  const xMax = (w - cx) / scale
  const drawRange = (xMax - xMin) * drawProgress
  let first = true

  for (let px = 0; px <= drawRange * scale; px += 1) {
    const xVal = xMin + px / scale
    const yVal = a * xVal * xVal + b * xVal + c
    const screenX = cx + xVal * scale
    const screenY = cy - yVal * scale

    if (screenY < -20 || screenY > h + 20) { first = true; continue }
    if (first) { ctx.moveTo(screenX, screenY); first = false }
    else ctx.lineTo(screenX, screenY)
  }
  ctx.stroke()

  if (drawProgress >= 0.5) {
    const alpha = Math.min((drawProgress - 0.5) * 4, 1)
    ctx.globalAlpha = alpha

    // Vertex point
    const vsx = cx + vx * scale
    const vsy = cy - vy * scale
    if (vsx > 0 && vsx < w && vsy > 0 && vsy < h) {
      ctx.fillStyle = '#4A7C59'
      ctx.beginPath(); ctx.arc(vsx, vsy, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#4A7C59'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`顶点(${vx.toFixed(1)}, ${vy.toFixed(1)})`, vsx + 8, vsy - 6)
    }

    // Axis of symmetry
    ctx.strokeStyle = '#D4A853'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(vsx, 0)
    ctx.lineTo(vsx, h)
    ctx.stroke()
    ctx.setLineDash([])

    // Roots
    roots.forEach((r, i) => {
      const rx = cx + r * scale
      if (rx > 0 && rx < w) {
        ctx.fillStyle = '#8B5CF6'
        ctx.beginPath(); ctx.arc(rx, cy, 5, 0, Math.PI * 2); ctx.fill()
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`x${i + 1}=${r.toFixed(2)}`, rx, cy + 20)
      }
    })

    // Y-intercept
    const yIntScreenY = cy - c * scale
    if (yIntScreenY > 0 && yIntScreenY < h) {
      ctx.fillStyle = '#3B82F6'
      ctx.beginPath(); ctx.arc(cx, yIntScreenY, 4, 0, Math.PI * 2); ctx.fill()
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`(0, ${c})`, cx + 8, yIntScreenY - 4)
    }

    ctx.globalAlpha = 1
  }

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`y = ${a}x² + ${b}x + ${c}`, 16, 24)
  ctx.fillText(`Δ = ${disc.toFixed(2)} ${disc > 0 ? '(两个实根)' : disc === 0 ? '(一个重根)' : '(无实根)'}`, 16, 42)
  ctx.fillText(`对称轴: x = ${vx.toFixed(2)}`, 16, 60)
  ctx.fillText(`开口${a > 0 ? '向上 ↑' : '向下 ↓'}`, 16, 78)

  // Legend
  const legends = [['顶点', '#4A7C59'], ['对称轴', '#D4A853'], ['零点', '#8B5CF6'], ['y截距', '#3B82F6']]
  legends.forEach(([label, color], i) => {
    const lx = w - 100
    const ly = 20 + i * 18
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(lx, ly - 2, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#6B6560'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label as string, lx + 10, ly)
  })
}

/* ───────── 3. Exponential & Logarithmic (指数与对数) ───────── */

function drawExpLog(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const base = params.base
  const showLog = params.showLog // 0=exp, 1=log, 2=both
  const drawProgress = Math.min(t * 0.6, 1)

  const cx = w * 0.4
  const cy = h / 2
  const scale = 40

  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)
  drawCoordSystem(ctx, w, h, cx, cy, scale)

  const showExp = showLog === 0 || showLog === 2
  const showLogFn = showLog === 1 || showLog === 2

  // y=1 line (for exp)
  if (showExp) {
    ctx.strokeStyle = '#D0C8BE'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 0.8
    const y1 = cy - 1 * scale
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(w, y1); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#9C9590'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('y=1', cx + 4, y1 - 4)
  }

  // x=1 line (for log)
  if (showLogFn) {
    ctx.strokeStyle = '#D0C8BE'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 0.8
    const x1 = cx + 1 * scale
    ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, h); ctx.stroke()
    ctx.setLineDash([])
  }

  // Draw exponential: y = base^x
  if (showExp) {
    ctx.strokeStyle = '#C45D3E'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let first = true
    const xRange = drawProgress * (w - cx) / scale
    for (let px = 0; px <= xRange * scale; px += 1) {
      const xVal = -cx / scale + px / scale
      const yVal = Math.pow(base, xVal)
      const screenX = cx + xVal * scale
      const screenY = cy - yVal * scale
      if (screenY < -50 || screenY > h + 50) { first = true; continue }
      if (first) { ctx.moveTo(screenX, screenY); first = false }
      else ctx.lineTo(screenX, screenY)
    }
    ctx.stroke()

    // Key point (0, 1)
    if (drawProgress > 0.3) {
      ctx.fillStyle = '#C45D3E'
      ctx.beginPath(); ctx.arc(cx, cy - scale, 5, 0, Math.PI * 2); ctx.fill()
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('(0, 1)', cx + 8, cy - scale - 6)
    }
  }

  // Draw logarithmic: y = log_base(x)
  if (showLogFn) {
    ctx.strokeStyle = '#4A7C59'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let first = true
    for (let px = 1; px <= drawProgress * (w - cx); px += 1) {
      const xVal = px / scale
      if (xVal <= 0) continue
      const yVal = Math.log(xVal) / Math.log(base)
      const screenX = cx + px
      const screenY = cy - yVal * scale
      if (screenY < -50 || screenY > h + 50) { first = true; continue }
      if (first) { ctx.moveTo(screenX, screenY); first = false }
      else ctx.lineTo(screenX, screenY)
    }
    ctx.stroke()

    // Key point (1, 0)
    if (drawProgress > 0.3) {
      ctx.fillStyle = '#4A7C59'
      ctx.beginPath(); ctx.arc(cx + scale, cy, 5, 0, Math.PI * 2); ctx.fill()
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('(1, 0)', cx + scale + 8, cy - 6)
    }
  }

  // Symmetry line y=x (when showing both)
  if (showLog === 2) {
    ctx.strokeStyle = '#D4A853'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1
    ctx.beginPath()
    const minV = Math.min(-cx / scale, -cy / scale)
    const maxV = Math.min((w - cx) / scale, (h - cy) / scale)
    ctx.moveTo(cx - minV * scale, cy + minV * scale)
    ctx.lineTo(cx + maxV * scale, cy - maxV * scale)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#D4A853'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('y = x', cx + maxV * scale - 30, cy - maxV * scale + 16)
  }

  // Moving point
  const moveX = ((t * 0.5) % 4) - 1
  if (showExp) {
    const moveY = Math.pow(base, moveX)
    const sx = cx + moveX * scale
    const sy = cy - moveY * scale
    if (sy > 0 && sy < h && sx > cx - 30) {
      ctx.fillStyle = '#C45D3E'
      ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  if (showExp) ctx.fillText(`y = ${base}^x`, 16, 24)
  if (showLogFn) ctx.fillText(`y = log_${base}(x)`, 16, showExp ? 42 : 24)
  ctx.fillText(`底数: ${base}`, 16, showExp && showLogFn ? 60 : showExp || showLogFn ? 42 : 24)

  // Legend
  const legends = []
  if (showExp) legends.push(['指数函数', '#C45D3E'])
  if (showLogFn) legends.push(['对数函数', '#4A7C59'])
  if (showLog === 2) legends.push(['y=x对称', '#D4A853'])
  legends.forEach(([label, color], i) => {
    const lx = w - 110
    const ly = 20 + i * 18
    ctx.fillStyle = color
    ctx.fillRect(lx, ly - 4, 14, 3)
    ctx.fillStyle = '#6B6560'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label as string, lx + 20, ly)
  })
}

/* ───────── 4. Polar Curves (极坐标曲线) ───────── */

function drawPolar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const curveType = Math.round(params.curveType) // 0=rose, 1=cardioid, 2=spiral, 3=butterfly
  const petals = Math.round(params.petals)
  const drawProgress = Math.min(t * 0.4, 1)

  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) * 0.38

  ctx.fillStyle = '#FEFCF9'
  ctx.fillRect(0, 0, w, h)

  // Polar grid (circles)
  ctx.strokeStyle = '#EDE7E0'
  ctx.lineWidth = 0.5
  for (let r = 1; r <= 4; r++) {
    const radius = (r / 4) * maxR
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke()
  }
  // Radial lines
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + maxR * Math.cos(a), cy - maxR * Math.sin(a)); ctx.stroke()
  }
  // Axes
  ctx.strokeStyle = '#9C9590'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(cx - maxR - 10, cy); ctx.lineTo(cx + maxR + 10, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy - maxR - 10); ctx.lineTo(cx, cy + maxR + 10); ctx.stroke()

  // Curve functions
  const curves = [
    { name: '玫瑰线', formula: `r = cos(${petals}θ)`, fn: (θ: number) => Math.cos(petals * θ), color: '#C45D3E' },
    { name: '心形线', formula: 'r = 1 + cos(θ)', fn: (θ: number) => (1 + Math.cos(θ)) / 2, color: '#E91E63' },
    { name: '阿基米德螺线', formula: 'r = θ/(2π)', fn: (θ: number) => θ / (2 * Math.PI * 4), color: '#4A7C59' },
    { name: '蝴蝶曲线', formula: 'r = e^sin-2cos4+...', fn: (θ: number) => {
      const v = Math.exp(Math.sin(θ)) - 2 * Math.cos(4 * θ) + Math.pow(Math.sin((2 * θ - Math.PI) / 24), 5)
      return v / 8
    }, color: '#8B5CF6' },
  ]

  const curve = curves[curveType]
  const totalAngle = curveType === 2 ? 8 * Math.PI : curveType === 3 ? 12 * Math.PI : 2 * Math.PI * (curveType === 0 && petals % 2 === 0 ? 1 : 2)
  const drawAngle = totalAngle * drawProgress

  // Draw curve
  ctx.strokeStyle = curve.color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  let first = true

  for (let a = 0; a <= drawAngle; a += 0.02) {
    const r = curve.fn(a) * maxR
    const x = cx + r * Math.cos(a)
    const y = cy - r * Math.sin(a)

    if (first) { ctx.moveTo(x, y); first = false }
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Moving point
  const currentAngle = (t * 1.5) % totalAngle
  const currentR = curve.fn(currentAngle) * maxR
  const dotX = cx + currentR * Math.cos(currentAngle)
  const dotY = cy - currentR * Math.sin(currentAngle)

  // Trail
  ctx.strokeStyle = curve.color + '30'
  ctx.lineWidth = 1
  ctx.beginPath()
  const trailLen = 30
  for (let i = 0; i < trailLen; i++) {
    const ta = currentAngle - i * 0.05
    const tr = curve.fn(ta) * maxR
    const tx = cx + tr * Math.cos(ta)
    const ty = cy - tr * Math.sin(ta)
    if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty)
  }
  ctx.stroke()

  // Dot
  ctx.fillStyle = curve.color
  ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.beginPath(); ctx.arc(dotX, dotY, 2, 0, Math.PI * 2); ctx.fill()

  // Radius line
  ctx.strokeStyle = curve.color + '50'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dotX, dotY); ctx.stroke()
  ctx.setLineDash([])

  // Data
  ctx.fillStyle = '#6B6560'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(curve.formula, 16, 24)
  ctx.fillText(`θ = ${(currentAngle % (2 * Math.PI)).toFixed(2)} rad`, 16, 42)
  ctx.fillText(`r = ${(Math.abs(currentR / maxR)).toFixed(3)}`, 16, 60)
  ctx.fillText(`绘制进度: ${(drawProgress * 100).toFixed(0)}%`, 16, 78)

  // Curve name
  ctx.fillStyle = curve.color
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(curve.name, w - 20, 30)
}

/* ───────── Function Registry ───────── */

const functions: FuncDef[] = [
  {
    key: 'trig', name: '三角函数', category: '基础函数',
    formula: 'y = A·sin(ωx + φ)',
    description: '三角函数是描述周期现象的基本数学工具。正弦、余弦函数具有周期性，振幅A控制高度，角频率ω控制周期，初相φ控制平移。单位圆上的投影与三角函数值一一对应。',
    code: `// 三角函数定义
sin(θ) = 对边/斜边
cos(θ) = 邻边/斜边
tan(θ) = sin(θ)/cos(θ)

// 一般形式
y = A·sin(ωx + φ)

// 周期
T = 2π/ω

// 频率
f = 1/T = ω/(2π)

// 特殊值
sin(0)=0, sin(π/2)=1, sin(π)=0
cos(0)=1, cos(π/2)=0, cos(π)=-1`,
    params: [
      { key: 'amplitude', label: '振幅 A', min: 0.5, max: 3, step: 0.5, default: 1, unit: '' },
      { key: 'frequency', label: '角频率 ω', min: 0.5, max: 4, step: 0.5, default: 1, unit: '' },
      { key: 'phase', label: '初相 φ', min: 0, max: 360, step: 15, default: 0, unit: '°' },
      { key: 'funcType', label: '函数类型', min: 0, max: 2, step: 1, default: 0, unit: '' },
    ],
  },
  {
    key: 'quadratic', name: '二次函数', category: '多项式',
    formula: 'y = ax² + bx + c',
    description: '二次函数的图像是抛物线，是最简单的非线性函数。系数a决定开口方向和宽窄，b影响对称轴位置，c是y轴截距。判别式Δ=b²-4ac决定与x轴的交点个数。',
    code: `// 一般式
y = ax² + bx + c

// 顶点式
y = a(x - h)² + k
h = -b/(2a), k = c - b²/(4a)

// 判别式
Δ = b² - 4ac
Δ > 0 → 两个实根
Δ = 0 → 一个重根
Δ < 0 → 无实根

// 韦达定理
x₁ + x₂ = -b/a
x₁ · x₂ = c/a

// 对称轴
x = -b/(2a)`,
    params: [
      { key: 'a', label: '系数 a', min: -3, max: 3, step: 0.5, default: 1, unit: '' },
      { key: 'b', label: '系数 b', min: -5, max: 5, step: 1, default: -2, unit: '' },
      { key: 'c', label: '系数 c', min: -5, max: 5, step: 1, default: -3, unit: '' },
    ],
  },
  {
    key: 'explog', name: '指数与对数', category: '超越函数',
    formula: 'y = aˣ / y = logₐ(x)',
    description: '指数函数和对数函数互为反函数，图像关于y=x对称。指数函数描述增长/衰减过程，对数函数是其逆运算。底数a>1时递增，0<a<1时递减。',
    code: `// 指数函数
y = aˣ (a>0, a≠1)
定义域: (-∞, +∞)
值域: (0, +∞)
过点: (0, 1)

// 对数函数
y = logₐ(x) (a>0, a≠1)
定义域: (0, +∞)
值域: (-∞, +∞)
过点: (1, 0)

// 运算法则
aᵐ·aⁿ = aᵐ⁺ⁿ
logₐ(MN) = logₐM + logₐN
logₐ(Mⁿ) = n·logₐM

// 换底公式
logₐb = ln(b)/ln(a)`,
    params: [
      { key: 'base', label: '底数 a', min: 1.5, max: 5, step: 0.5, default: 2, unit: '' },
      { key: 'showLog', label: '显示', min: 0, max: 2, step: 1, default: 2, unit: '' },
    ],
  },
  {
    key: 'polar', name: '极坐标曲线', category: '参数曲线',
    formula: 'r = f(θ)',
    description: '极坐标曲线用极径r和极角θ描述平面图形。玫瑰线、心形线、螺线等优美曲线都可用简洁的极坐标方程表示，广泛应用于工程和艺术设计中。',
    code: `// 玫瑰线
r = cos(nθ)
n为奇数 → n瓣
n为偶数 → 2n瓣

// 心形线
r = a(1 + cos(θ))

// 阿基米德螺线
r = aθ
等速增长，相邻圈距=2πa

// 蝴蝶曲线
r = e^sinθ - 2cos4θ
  + sin⁵((2θ-π)/24)

// 极坐标→直角坐标
x = r·cos(θ)
y = r·sin(θ)`,
    params: [
      { key: 'curveType', label: '曲线类型', min: 0, max: 3, step: 1, default: 0, unit: '' },
      { key: 'petals', label: '花瓣数 n', min: 2, max: 8, step: 1, default: 3, unit: '' },
    ],
  },
]

/* ───────── Component ───────── */

export default function MathFunctions() {
  const [selectedFunc, setSelectedFunc] = useState(functions[0])
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    functions[0].params.forEach((pd) => { p[pd.key] = pd.default })
    return p
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const initParams = useCallback((fn: FuncDef) => {
    const p: Record<string, number> = {}
    fn.params.forEach((pd) => { p[pd.key] = pd.default })
    setParams(p)
    setTime(0)
    setIsPlaying(false)
  }, [])

  useEffect(() => { initParams(selectedFunc) }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ctx, w, h } = setupCanvas(canvas)

    const drawFn: Record<string, Function> = {
      trig: drawTrig,
      quadratic: drawQuadratic,
      explog: drawExpLog,
      polar: drawPolar,
    }
    drawFn[selectedFunc.key]?.(ctx, w, h, time, params)
  }, [selectedFunc, time, params])

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

  const handleFuncChange = (fn: FuncDef) => {
    setSelectedFunc(fn)
    initParams(fn)
  }

  const handleReset = () => {
    setTime(0)
    setIsPlaying(false)
  }

  const handleParamChange = (key: string, val: number) => {
    setParams((p) => ({ ...p, [key]: val }))
    setTime(0)
  }

  const funcTypeNames = ['sin', 'cos', 'tan']
  const showLogNames = ['仅指数', '仅对数', '两者对比']
  const curveTypeNames = ['玫瑰线', '心形线', '螺线', '蝴蝶曲线']

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          数学函数可视化
        </div>
        <Title level={3} style={{ margin: 0 }}>数学函数演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过动态图形直观理解数学函数的性质。调节参数观察曲线变化，深入掌握函数的核心特征。
        </Paragraph>
      </div>

      {/* Function selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {functions.map((fn) => (
          <button
            key={fn.key}
            onClick={() => handleFuncChange(fn)}
            style={{
              padding: '8px 18px', borderRadius: 4,
              border: `1px solid ${selectedFunc.key === fn.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedFunc.key === fn.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedFunc.key === fn.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: selectedFunc.key === fn.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            <FunctionOutlined style={{ marginRight: 6 }} />
            {fn.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'rgba(0,0,0,0.04)', color: 'var(--ink-tertiary)',
            }}>
              {fn.category}
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
            background: 'var(--bg-muted)', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
              {selectedFunc.formula}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
              t = {time.toFixed(2)}s
            </span>
          </div>
          <canvas ref={canvasRef} style={{ width: '100%', height: 380, display: 'block' }} />
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
            数学公式
          </div>
          <pre style={{
            padding: 16, margin: 0, fontSize: 12, lineHeight: 1.8,
            color: '#D4D4D4', fontFamily: 'var(--font-mono)',
            overflow: 'auto', maxHeight: 420, whiteSpace: 'pre-wrap',
          }}>
            {selectedFunc.code}
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
          {isPlaying ? '暂停' : '播放'}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        <div style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {isPlaying ? '绘制中...' : time > 0 ? '已暂停' : '就绪'}
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
          参数调节
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedFunc.params.map((pd) => (
            <div key={pd.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text style={{ fontSize: 13, color: 'var(--ink-secondary)', width: 90, flexShrink: 0 }}>
                {pd.label}
              </Text>
              {pd.key === 'funcType' ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {funcTypeNames.map((name, idx) => (
                    <button key={idx} onClick={() => handleParamChange(pd.key, idx)} style={{
                      padding: '4px 14px', borderRadius: 4, fontSize: 12,
                      border: `1px solid ${(params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--border)'}`,
                      background: (params[pd.key] ?? pd.default) === idx ? 'var(--accent-soft)' : 'transparent',
                      color: (params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--ink-secondary)',
                      cursor: 'pointer',
                    }}>{name}</button>
                  ))}
                </div>
              ) : pd.key === 'showLog' ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {showLogNames.map((name, idx) => (
                    <button key={idx} onClick={() => handleParamChange(pd.key, idx)} style={{
                      padding: '4px 14px', borderRadius: 4, fontSize: 12,
                      border: `1px solid ${(params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--border)'}`,
                      background: (params[pd.key] ?? pd.default) === idx ? 'var(--accent-soft)' : 'transparent',
                      color: (params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--ink-secondary)',
                      cursor: 'pointer',
                    }}>{name}</button>
                  ))}
                </div>
              ) : pd.key === 'curveType' ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {curveTypeNames.map((name, idx) => (
                    <button key={idx} onClick={() => handleParamChange(pd.key, idx)} style={{
                      padding: '4px 12px', borderRadius: 4, fontSize: 12,
                      border: `1px solid ${(params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--border)'}`,
                      background: (params[pd.key] ?? pd.default) === idx ? 'var(--accent-soft)' : 'transparent',
                      color: (params[pd.key] ?? pd.default) === idx ? 'var(--accent)' : 'var(--ink-secondary)',
                      cursor: 'pointer',
                    }}>{name}</button>
                  ))}
                </div>
              ) : (
                <>
                  <Slider min={pd.min} max={pd.max} step={pd.step}
                    value={params[pd.key] ?? pd.default}
                    onChange={(v) => handleParamChange(pd.key, v as number)}
                    style={{ flex: 1 }} />
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
          知识要点
        </div>
        <Title level={4} style={{ marginBottom: 8 }}>{selectedFunc.name}</Title>
        <Paragraph style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedFunc.description}
        </Paragraph>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Tag color="default">公式：{selectedFunc.formula}</Tag>
          <Tag color="default">类别：{selectedFunc.category}</Tag>
        </div>
      </div>
    </div>
  )
}
