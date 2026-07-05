import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Simulation Definitions ───────── */

interface SimDef {
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

/* ───────── Color Palette ───────── */
const C = {
  bg: '#FEFCF9',
  grid: '#EDE7E0',
  gridStrong: '#D0C8BE',
  object: '#C45D3E',
  objectFill: 'rgba(196, 93, 62, 0.15)',
  trail: 'rgba(196, 93, 62, 0.25)',
  velocity: '#4A7C59',
  acceleration: '#D4A853',
  force: '#8B5CF6',
  spring: '#3B82F6',
  text: '#6B6560',
  textLight: '#9C9590',
  ground: '#D0C8BE',
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

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = C.grid
  ctx.lineWidth = 0.5
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label?: string) {
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return
  const angle = Math.atan2(dy, dx)
  const headLen = Math.min(10, len * 0.3)

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + dx, y + dy)
  ctx.stroke()

  // Arrowhead
  ctx.beginPath()
  ctx.moveTo(x + dx, y + dy)
  ctx.lineTo(x + dx - headLen * Math.cos(angle - 0.4), y + dy - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x + dx - headLen * Math.cos(angle + 0.4), y + dy - headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()

  if (label) {
    ctx.font = '11px "DM Sans", sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.fillText(label, x + dx + 6, y + dy - 4)
  }
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, groundY: number) {
  ctx.fillStyle = C.ground
  ctx.fillRect(0, groundY, w, 3)
  // Hatching
  ctx.strokeStyle = C.gridStrong
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 12) {
    ctx.beginPath()
    ctx.moveTo(x, groundY + 3)
    ctx.lineTo(x - 8, groundY + 12)
    ctx.stroke()
  }
}

/* ───────── Simulation Engines ───────── */

// 1. Projectile Motion (抛体运动)
function drawProjectile(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const g = params.gravity
  const v0 = params.velocity
  const angle = params.angle * Math.PI / 180
  const groundY = h - 50
  const scale = 3

  const vx = v0 * Math.cos(angle)
  const vy = v0 * Math.sin(angle)
  const x = vx * t
  const y = vy * t - 0.5 * g * t * t
  const curVy = vy - g * t

  const originX = 60
  const originY = groundY

  const px = originX + x * scale
  const py = originY - y * scale

  drawGrid(ctx, w, h)
  drawGround(ctx, w, groundY)

  // Trajectory trail
  ctx.strokeStyle = C.trail
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  const totalTime = (2 * vy) / g
  for (let tt = 0; tt <= Math.min(t, totalTime); tt += 0.05) {
    const tx = originX + vx * tt * scale
    const ty = originY - (vy * tt - 0.5 * g * tt * tt) * scale
    if (tt === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Ball
  if (py <= groundY) {
    ctx.fillStyle = C.objectFill
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = C.object
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill()

    // Velocity vector
    drawArrow(ctx, px, py, vx * scale * 0.3, -curVy * scale * 0.3, C.velocity, `v=${Math.sqrt(vx * vx + curVy * curVy).toFixed(1)}m/s`)
    // Gravity vector
    drawArrow(ctx, px, py, 0, g * scale * 0.5, C.acceleration, `g=${g}m/s²`)
  }

  // Data panel
  ctx.fillStyle = C.text
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  const height = Math.max(0, vy * t - 0.5 * g * t * t)
  ctx.fillText(`时间: ${t.toFixed(2)}s`, 16, 24)
  ctx.fillText(`高度: ${height.toFixed(1)}m`, 16, 42)
  ctx.fillText(`水平距离: ${x.toFixed(1)}m`, 16, 60)
  ctx.fillText(`最大高度: ${(vy * vy / (2 * g)).toFixed(1)}m`, 16, 78)

  return py <= groundY && t <= totalTime + 0.1
}

// 2. Simple Pendulum (单摆)
function drawPendulum(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const g = params.gravity
  const length = params.length
  const initAngle = params.initAngle * Math.PI / 180
  const damping = params.damping

  const pivotX = w / 2
  const pivotY = 60
  const scale = 1.8
  const len = length * scale

  // Physics: θ(t) = θ₀ * cos(ωt) * e^(-γt)
  const omega = Math.sqrt(g / length)
  const theta = initAngle * Math.cos(omega * t) * Math.exp(-damping * t)
  const angularVel = -initAngle * omega * Math.sin(omega * t) * Math.exp(-damping * t)

  const bobX = pivotX + len * Math.sin(theta)
  const bobY = pivotY + len * Math.cos(theta)

  drawGrid(ctx, w, h)

  // Pivot
  ctx.fillStyle = C.gridStrong
  ctx.fillRect(pivotX - 30, pivotY - 6, 60, 6)
  ctx.fillStyle = C.text
  ctx.beginPath(); ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2); ctx.fill()

  // String
  ctx.strokeStyle = C.text
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pivotX, pivotY)
  ctx.lineTo(bobX, bobY)
  ctx.stroke()

  // Bob
  ctx.fillStyle = C.objectFill
  ctx.beginPath(); ctx.arc(bobX, bobY, 22, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = C.object
  ctx.beginPath(); ctx.arc(bobX, bobY, 14, 0, Math.PI * 2); ctx.fill()

  // Force vectors
  const forceScale = 25
  // Gravity
  drawArrow(ctx, bobX, bobY, 0, g * forceScale * 0.04, C.acceleration, 'mg')
  // Tangential (restoring force component)
  const tangentialForce = -g * Math.sin(theta)
  const tangentX = Math.cos(theta) * tangentialForce * forceScale * 0.04
  const tangentY = -Math.sin(theta) * tangentialForce * forceScale * 0.04
  drawArrow(ctx, bobX, bobY, tangentX, tangentY, C.force, 'F切向')
  // Tension along string toward pivot
  const tensionMag = g * Math.cos(theta) + length * angularVel * angularVel
  const tensionX = (pivotX - bobX) / len * tensionMag * forceScale * 0.03
  const tensionY = (pivotY - bobY) / len * tensionMag * forceScale * 0.03
  drawArrow(ctx, bobX, bobY, tensionX, tensionY, C.spring, 'T张力')

  // Swing arc (faint)
  ctx.strokeStyle = 'rgba(196,93,62,0.12)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, len, -Math.PI / 2 + initAngle + Math.PI / 2, -Math.PI / 2 - initAngle + Math.PI / 2, true)
  ctx.stroke()
  ctx.setLineDash([])

  // Data
  ctx.fillStyle = C.text
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  const period = (2 * Math.PI / omega).toFixed(2)
  ctx.fillText(`周期: ${period}s`, 16, 24)
  ctx.fillText(`角度: ${(theta * 180 / Math.PI).toFixed(1)}°`, 16, 42)
  ctx.fillText(`角速度: ${angularVel.toFixed(3)}rad/s`, 16, 60)
  ctx.fillText(`绳长: ${length}m`, 16, 78)

  return true
}

// 3. Spring-Mass System (弹簧振子)
function drawSpringMass(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const k = params.stiffness
  const mass = params.mass
  const initDisp = params.initDisp
  const damping = params.damping

  const omega = Math.sqrt(k / mass)
  const disp = initDisp * Math.cos(omega * t) * Math.exp(-damping * t)
  const vel = -initDisp * omega * Math.sin(omega * t) * Math.exp(-damping * t)
  const force = -k * disp

  const centerY = h / 2
  const wallX = 50
  const eqX = w / 2
  const scale = 2.5
  const massX = eqX + disp * scale

  drawGrid(ctx, w, h)

  // Wall
  ctx.fillStyle = C.gridStrong
  ctx.fillRect(wallX - 8, centerY - 60, 8, 120)
  for (let y = centerY - 60; y < centerY + 60; y += 10) {
    ctx.strokeStyle = C.gridStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(wallX - 8, y)
    ctx.lineTo(wallX - 16, y + 8)
    ctx.stroke()
  }

  // Spring (zigzag)
  const springStart = wallX
  const springEnd = massX - 20
  const coils = 12
  const coilWidth = 14
  ctx.strokeStyle = C.spring
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(springStart, centerY)
  const segLen = (springEnd - springStart) / (coils * 2)
  for (let i = 0; i < coils * 2; i++) {
    const sx = springStart + (i + 1) * segLen
    const sy = centerY + (i % 2 === 0 ? -coilWidth : coilWidth)
    ctx.lineTo(sx, sy)
  }
  ctx.lineTo(springEnd, centerY)
  ctx.stroke()

  // Mass block
  const blockSize = 40
  ctx.fillStyle = C.objectFill
  ctx.fillRect(massX - blockSize / 2 - 2, centerY - blockSize / 2 - 2, blockSize + 4, blockSize + 4)
  ctx.fillStyle = C.object
  ctx.fillRect(massX - blockSize / 2, centerY - blockSize / 2, blockSize, blockSize)
  ctx.fillStyle = '#FEFCF9'
  ctx.font = 'bold 13px "DM Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('m', massX, centerY + 5)

  // Equilibrium line
  ctx.strokeStyle = 'rgba(107,101,96,0.3)'
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(eqX, centerY - 70)
  ctx.lineTo(eqX, centerY + 70)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C.textLight
  ctx.font = '10px "DM Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('平衡位置', eqX, centerY - 76)

  // Force vector
  const forceScale = 0.8
  drawArrow(ctx, massX, centerY, force * forceScale, 0, C.force, `F=${force.toFixed(1)}N`)
  // Velocity vector
  drawArrow(ctx, massX, centerY + 30, vel * 8, 0, C.velocity, `v=${vel.toFixed(1)}m/s`)

  // Ground line
  ctx.strokeStyle = C.ground
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(wallX - 20, centerY + blockSize / 2 + 1)
  ctx.lineTo(w - 30, centerY + blockSize / 2 + 1)
  ctx.stroke()

  // Data
  ctx.fillStyle = C.text
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  const period = (2 * Math.PI / omega).toFixed(2)
  const energy = 0.5 * k * disp * disp + 0.5 * mass * vel * vel
  ctx.fillText(`位移: ${disp.toFixed(2)}m`, 16, 24)
  ctx.fillText(`速度: ${vel.toFixed(2)}m/s`, 16, 42)
  ctx.fillText(`周期: ${period}s`, 16, 60)
  ctx.fillText(`总能量: ${energy.toFixed(1)}J`, 16, 78)
  ctx.fillText(`弹性系数: ${k}N/m`, 16, 96)

  return true
}

// 4. Newton's Cradle (牛顿摆)
function drawNewtonCradle(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, params: Record<string, number>) {
  const count = Math.round(params.count)
  const length = params.length
  const initAngle = params.initAngle

  const frameY = 50
  const frameW = Math.min(w - 80, count * 50 + 40)
  const frameX = (w - frameW) / 2
  const scale = 2.2
  const len = length * scale
  const ballR = 16
  const spacing = ballR * 2 + 1

  const omega = Math.sqrt(9.8 / length)
  const period = 2 * Math.PI / omega

  drawGrid(ctx, w, h)

  // Frame
  ctx.strokeStyle = C.gridStrong
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(frameX, frameY)
  ctx.lineTo(frameX + frameW, frameY)
  ctx.stroke()
  // Frame legs
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(frameX, frameY); ctx.lineTo(frameX - 10, frameY + len + ballR + 30)
  ctx.moveTo(frameX + frameW, frameY); ctx.lineTo(frameX + frameW + 10, frameY + len + ballR + 30)
  ctx.stroke()

  // Each ball
  for (let i = 0; i < count; i++) {
    const pivotX = frameX + 20 + i * spacing
    const pivotY = frameY

    // Phase: balls transfer energy. Simplified model.
    const phase = (t % period) / period
    let theta = 0

    if (i === 0) {
      // Leftmost ball swings
      if (phase < 0.5) {
        theta = -initAngle * Math.PI / 180 * Math.cos(phase * Math.PI)
      } else {
        theta = 0
      }
    } else if (i === count - 1) {
      // Rightmost ball swings
      if (phase >= 0.5) {
        theta = initAngle * Math.PI / 180 * Math.cos((phase - 0.5) * Math.PI)
      } else {
        theta = 0
      }
    }

    const bobX = pivotX + len * Math.sin(theta)
    const bobY = pivotY + len * Math.cos(theta)

    // String
    ctx.strokeStyle = C.text
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pivotX, pivotY)
    ctx.lineTo(bobX, bobY)
    ctx.stroke()

    // Ball
    ctx.fillStyle = i === 0 || i === count - 1 ? C.object : 'rgba(196,93,62,0.5)'
    ctx.beginPath()
    ctx.arc(bobX, bobY, ballR, 0, Math.PI * 2)
    ctx.fill()

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(bobX - 4, bobY - 4, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Data
  ctx.fillStyle = C.text
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`摆球数: ${count}`, 16, 24)
  ctx.fillText(`绳长: ${length}m`, 16, 42)
  ctx.fillText(`周期: ${period.toFixed(2)}s`, 16, 60)
  ctx.fillText(`初始角度: ${initAngle}°`, 16, 78)

  return true
}

/* ───────── Simulation Registry ───────── */

const simulations: SimDef[] = [
  {
    key: 'projectile', name: '抛体运动', category: '力学',
    formula: 'x=v₀cosθ·t, y=v₀sinθ·t-½gt²',
    description: '物体以一定初速度和角度抛出后，在重力作用下的运动轨迹为抛物线。水平方向匀速运动，竖直方向匀加速运动。',
    code: `// 抛体运动方程
x(t) = v₀ · cos(θ) · t
y(t) = v₀ · sin(θ) · t - ½g·t²

// 速度分量
vx(t) = v₀ · cos(θ)
vy(t) = v₀ · sin(θ) - g·t

// 最大高度
H = v₀²·sin²(θ) / (2g)

// 射程
R = v₀²·sin(2θ) / g`,
    params: [
      { key: 'velocity', label: '初速度', min: 10, max: 80, step: 5, default: 40, unit: 'm/s' },
      { key: 'angle', label: '抛射角', min: 15, max: 80, step: 5, default: 45, unit: '°' },
      { key: 'gravity', label: '重力加速度', min: 1, max: 20, step: 1, default: 10, unit: 'm/s²' },
    ],
  },
  {
    key: 'pendulum', name: '单摆运动', category: '力学',
    formula: 'T=2π√(L/g), θ(t)=θ₀cos(ωt)e^(-γt)',
    description: '单摆在小角度摆动时做简谐运动，周期仅与绳长和重力加速度有关，与摆球质量无关。阻尼使振幅逐渐衰减。',
    code: `// 单摆运动方程
θ(t) = θ₀ · cos(ωt) · e^(-γt)

// 角频率
ω = √(g/L)

// 周期
T = 2π/ω = 2π√(L/g)

// 切向力
F_t = -mg·sin(θ)

// 张力
T = mg·cos(θ) + mLω²`,
    params: [
      { key: 'length', label: '绳长', min: 0.5, max: 5, step: 0.5, default: 2, unit: 'm' },
      { key: 'initAngle', label: '初始角度', min: 5, max: 45, step: 5, default: 30, unit: '°' },
      { key: 'gravity', label: '重力加速度', min: 1, max: 20, step: 1, default: 10, unit: 'm/s²' },
      { key: 'damping', label: '阻尼系数', min: 0, max: 1, step: 0.1, default: 0.1, unit: '' },
    ],
  },
  {
    key: 'spring', name: '弹簧振子', category: '力学',
    formula: 'F=-kx, T=2π√(m/k)',
    description: '弹簧振子在弹性恢复力作用下做简谐运动。回复力与位移成正比、方向相反。系统机械能守恒（无阻尼时）。',
    code: `// 胡克定律
F = -k·x

// 运动方程
x(t) = A·cos(ωt)·e^(-γt)

// 角频率
ω = √(k/m)

// 周期
T = 2π√(m/k)

// 能量守恒
E = ½kx² + ½mv²`,
    params: [
      { key: 'stiffness', label: '弹性系数', min: 5, max: 80, step: 5, default: 30, unit: 'N/m' },
      { key: 'mass', label: '质量', min: 0.5, max: 5, step: 0.5, default: 2, unit: 'kg' },
      { key: 'initDisp', label: '初始位移', min: 10, max: 60, step: 5, default: 40, unit: 'm' },
      { key: 'damping', label: '阻尼系数', min: 0, max: 1, step: 0.1, default: 0.05, unit: '' },
    ],
  },
  {
    key: 'cradle', name: '牛顿摆', category: '力学',
    formula: '动量守恒: m₁v₁=m₂v₂, 能量守恒',
    description: '牛顿摆演示了动量守恒和能量守恒定律。当一侧摆球撞击静止的摆球时，动量和能量通过中间球传递到另一侧。',
    code: `// 动量守恒
m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'

// 动能守恒（弹性碰撞）
½m₁v₁² + ½m₂v₂² = ½m₁v₁'² + ½m₂v₂'²

// 等质量球碰撞交换速度
v₁' = v₂, v₂' = v₁

// 单摆周期
T = 2π√(L/g)`,
    params: [
      { key: 'count', label: '摆球数', min: 3, max: 7, step: 1, default: 5, unit: '个' },
      { key: 'length', label: '绳长', min: 1, max: 4, step: 0.5, default: 2, unit: 'm' },
      { key: 'initAngle', label: '初始角度', min: 10, max: 45, step: 5, default: 30, unit: '°' },
    ],
  },
]

/* ───────── Component ───────── */

export default function PhysicsSimulation() {
  const [selectedSim, setSelectedSim] = useState(simulations[0])
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {}
    simulations[0].params.forEach((pd) => { p[pd.key] = pd.default })
    return p
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const initParams = useCallback((sim: SimDef) => {
    const p: Record<string, number> = {}
    sim.params.forEach((pd) => { p[pd.key] = pd.default })
    setParams(p)
    setTime(0)
    setIsPlaying(false)
  }, [])

  useEffect(() => { initParams(selectedSim) }, [])

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ctx, w, h } = setupCanvas(canvas)

    const drawFn: Record<string, Function> = {
      projectile: drawProjectile,
      pendulum: drawPendulum,
      spring: drawSpringMass,
      cradle: drawNewtonCradle,
    }

    drawFn[selectedSim.key]?.(ctx, w, h, time, params)
  }, [selectedSim, time, params])

  useEffect(() => { draw() }, [draw])

  // Animation loop
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

  const handleSimChange = (sim: SimDef) => {
    setSelectedSim(sim)
    initParams(sim)
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
          物理力学实验室
        </div>
        <Title level={3} style={{ margin: 0 }}>物理力学演示</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过实时物理模拟，直观观察力学现象。调整参数探索物理规律，力的矢量实时可见。
        </Paragraph>
      </div>

      {/* Sim selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {simulations.map((sim) => (
          <button
            key={sim.key}
            onClick={() => handleSimChange(sim)}
            style={{
              padding: '8px 18px', borderRadius: 4,
              border: `1px solid ${selectedSim.key === sim.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedSim.key === sim.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedSim.key === sim.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: selectedSim.key === sim.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            <ExperimentOutlined style={{ marginRight: 6 }} />
            {sim.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'rgba(0,0,0,0.04)', color: 'var(--ink-tertiary)',
            }}>
              {sim.category}
            </Tag>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Canvas */}
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
              {selectedSim.formula}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
              t = {time.toFixed(2)}s
            </span>
          </div>
          <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block' }} />
          <div style={{
            padding: '10px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-tertiary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.velocity }} /> 速度
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.acceleration }} /> 重力
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.force }} /> 力
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.spring }} /> 张力/弹力
            </div>
          </div>
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
            物理公式
          </div>
          <pre style={{
            padding: 16, margin: 0, fontSize: 12, lineHeight: 1.8,
            color: '#D4D4D4', fontFamily: 'var(--font-mono)',
            overflow: 'auto', maxHeight: 400, whiteSpace: 'pre-wrap',
          }}>
            {selectedSim.code}
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
          {isPlaying ? '运行中' : time > 0 ? '已暂停' : '就绪'}
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
          {selectedSim.params.map((pd) => (
            <div key={pd.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text style={{ fontSize: 13, color: 'var(--ink-secondary)', width: 90, flexShrink: 0 }}>
                {pd.label}
              </Text>
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
          原理说明
        </div>
        <Title level={4} style={{ marginBottom: 8 }}>{selectedSim.name}</Title>
        <Paragraph style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedSim.description}
        </Paragraph>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Tag color="default">核心公式：{selectedSim.formula}</Tag>
          <Tag color="default">类别：{selectedSim.category}</Tag>
        </div>
      </div>
    </div>
  )
}
