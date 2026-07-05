import { useState, useRef, useEffect, useCallback } from 'react'
import { Typography, Button, Slider, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  StepForwardOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

const { Text, Paragraph, Title } = Typography

/* ───────── Algorithm Definitions ───────── */

interface AlgoStep {
  array: number[]
  highlighted: number[]
  sorted: number[]
  comparing: number[]
  description: string
}

interface AlgorithmDef {
  key: string
  name: string
  category: string
  complexity: string
  description: string
  code: string
  generateSteps: (input: number[]) => AlgoStep[]
}

function bubbleSortSteps(input: number[]): AlgoStep[] {
  const arr = [...input]
  const n = arr.length
  const steps: AlgoStep[] = []
  const sorted: number[] = []

  steps.push({ array: [...arr], highlighted: [], sorted: [], comparing: [], description: '初始数组，准备开始冒泡排序' })

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ array: [...arr], highlighted: [j, j + 1], sorted: [...sorted], comparing: [j, j + 1], description: `比较 arr[${j}]=${arr[j]} 和 arr[${j + 1}]=${arr[j + 1]}` })
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        steps.push({ array: [...arr], highlighted: [j, j + 1], sorted: [...sorted], comparing: [], description: `交换：${arr[j + 1]} > ${arr[j]}，交换位置` })
      }
    }
    sorted.unshift(n - 1 - i)
    steps.push({ array: [...arr], highlighted: [], sorted: [...sorted], comparing: [], description: `第 ${i + 1} 轮结束，最大值已冒泡到末尾` })
  }
  sorted.unshift(0)
  steps.push({ array: [...arr], highlighted: [], sorted: Array.from({ length: n }, (_, i) => i), comparing: [], description: '排序完成！' })
  return steps
}

function selectionSortSteps(input: number[]): AlgoStep[] {
  const arr = [...input]
  const n = arr.length
  const steps: AlgoStep[] = []
  const sorted: number[] = []

  steps.push({ array: [...arr], highlighted: [], sorted: [], comparing: [], description: '初始数组，准备开始选择排序' })

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    steps.push({ array: [...arr], highlighted: [i], sorted: [...sorted], comparing: [], description: `第 ${i + 1} 轮：从位置 ${i} 开始寻找最小值` })
    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...arr], highlighted: [minIdx, j], sorted: [...sorted], comparing: [minIdx, j], description: `比较当前最小值 arr[${minIdx}]=${arr[minIdx]} 与 arr[${j}]=${arr[j]}` })
      if (arr[j] < arr[minIdx]) minIdx = j
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      steps.push({ array: [...arr], highlighted: [i, minIdx], sorted: [...sorted], comparing: [], description: `交换 arr[${i}] 和 arr[${minIdx}]，将最小值放到位置 ${i}` })
    }
    sorted.push(i)
  }
  sorted.push(n - 1)
  steps.push({ array: [...arr], highlighted: [], sorted: Array.from({ length: n }, (_, i) => i), comparing: [], description: '排序完成！' })
  return steps
}

function insertionSortSteps(input: number[]): AlgoStep[] {
  const arr = [...input]
  const n = arr.length
  const steps: AlgoStep[] = []
  const sorted: number[] = [0]

  steps.push({ array: [...arr], highlighted: [0], sorted: [0], comparing: [], description: '初始数组，第一个元素视为已排序' })

  for (let i = 1; i < n; i++) {
    const key = arr[i]
    let j = i - 1
    steps.push({ array: [...arr], highlighted: [i], sorted: [...sorted], comparing: [], description: `取 arr[${i}]=${key}，在已排序部分中寻找插入位置` })
    while (j >= 0 && arr[j] > key) {
      steps.push({ array: [...arr], highlighted: [j, j + 1], sorted: [...sorted], comparing: [j, j + 1], description: `arr[${j}]=${arr[j]} > ${key}，右移` })
      arr[j + 1] = arr[j]
      j--
    }
    arr[j + 1] = key
    steps.push({ array: [...arr], highlighted: [j + 1], sorted: [...sorted], comparing: [], description: `将 ${key} 插入到位置 ${j + 1}` })
    sorted.push(i)
    steps.push({ array: [...arr], highlighted: [], sorted: [...sorted], comparing: [], description: `前 ${i + 1} 个元素已排序` })
  }
  steps.push({ array: [...arr], highlighted: [], sorted: Array.from({ length: n }, (_, i) => i), comparing: [], description: '排序完成！' })
  return steps
}

function quickSortSteps(input: number[]): AlgoStep[] {
  const arr = [...input]
  const n = arr.length
  const steps: AlgoStep[] = []
  const sorted: number[] = []

  steps.push({ array: [...arr], highlighted: [], sorted: [], comparing: [], description: '初始数组，准备开始快速排序' })

  function partition(lo: number, hi: number): number {
    const pivot = arr[hi]
    steps.push({ array: [...arr], highlighted: [hi], sorted: [...sorted], comparing: [], description: `选择基准值 arr[${hi}]=${pivot}` })
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      steps.push({ array: [...arr], highlighted: [j, hi], sorted: [...sorted], comparing: [j, hi], description: `比较 arr[${j}]=${arr[j]} 与基准值 ${pivot}` })
      if (arr[j] <= pivot) {
        i++
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]]
          steps.push({ array: [...arr], highlighted: [i, j], sorted: [...sorted], comparing: [], description: `arr[${j}]=${arr[j]} ≤ ${pivot}，交换到左侧` })
        }
      }
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]]
    sorted.push(i + 1)
    steps.push({ array: [...arr], highlighted: [i + 1], sorted: [...sorted], comparing: [], description: `基准值 ${pivot} 放到最终位置 ${i + 1}` })
    return i + 1
  }

  function qs(lo: number, hi: number) {
    if (lo < hi) {
      const p = partition(lo, hi)
      qs(lo, p - 1)
      qs(p + 1, hi)
    } else if (lo === hi) {
      sorted.push(lo)
      steps.push({ array: [...arr], highlighted: [lo], sorted: [...sorted], comparing: [], description: `位置 ${lo} 已确定` })
    }
  }

  qs(0, n - 1)
  steps.push({ array: [...arr], highlighted: [], sorted: Array.from({ length: n }, (_, i) => i), comparing: [], description: '排序完成！' })
  return steps
}

const algorithms: AlgorithmDef[] = [
  {
    key: 'bubble', name: '冒泡排序', category: '排序', complexity: 'O(n²)',
    description: '重复遍历数组，比较相邻元素，将较大的元素逐步"冒泡"到数组末端。每轮遍历将一个最大元素移到正确位置。',
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
}`,
    generateSteps: bubbleSortSteps,
  },
  {
    key: 'selection', name: '选择排序', category: '排序', complexity: 'O(n²)',
    description: '每次从未排序部分中找到最小元素，将其放到已排序部分的末尾。重复此过程直到所有元素排好序。',
    code: `function selectionSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
  }
}`,
    generateSteps: selectionSortSteps,
  },
  {
    key: 'insertion', name: '插入排序', category: '排序', complexity: 'O(n²)',
    description: '将数组分为已排序和未排序两部分，每次从未排序部分取出一个元素，在已排序部分中找到合适位置插入。',
    code: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]
      j--
    }
    arr[j + 1] = key
  }
}`,
    generateSteps: insertionSortSteps,
  },
  {
    key: 'quick', name: '快速排序', category: '排序', complexity: 'O(n log n)',
    description: '选择一个基准元素，将数组分为两部分：小于基准的放左边，大于基准的放右边，然后递归排序两部分。',
    code: `function quickSort(arr, lo, hi) {
  if (lo < hi) {
    const p = partition(arr, lo, hi)
    quickSort(arr, lo, p - 1)
    quickSort(arr, p + 1, hi)
  }
}
function partition(arr, lo, hi) {
  const pivot = arr[hi]
  let i = lo - 1
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++; [arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]]
  return i + 1
}`,
    generateSteps: quickSortSteps,
  },
]

/* ───────── Canvas Visualization ───────── */

const BAR_COLORS = {
  default: '#D0C8BE',
  highlighted: '#C45D3E',
  comparing: '#D4A853',
  sorted: '#4A7C59',
  pivot: '#8B5CF6',
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  step: AlgoStep,
  width: number,
  height: number,
) {
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, width * dpr, height * dpr)

  const arr = step.array
  const n = arr.length
  const maxVal = Math.max(...arr, 1)
  const padding = 40
  const gap = 6
  const totalWidth = width - padding * 2
  const barWidth = (totalWidth - gap * (n - 1)) / n
  const maxHeight = height - padding * 2

  for (let i = 0; i < n; i++) {
    const barH = (arr[i] / maxVal) * maxHeight
    const x = padding + i * (barWidth + gap)
    const y = height - padding - barH

    // Determine color
    let color = BAR_COLORS.default
    if (step.sorted.includes(i)) color = BAR_COLORS.sorted
    if (step.comparing.includes(i)) color = BAR_COLORS.comparing
    if (step.highlighted.includes(i) && !step.comparing.includes(i)) color = BAR_COLORS.highlighted

    // Bar shadow
    ctx.fillStyle = 'rgba(26,26,26,0.04)'
    ctx.beginPath()
    ctx.roundRect(x + 2, y + 2, barWidth, barH, [3, 3, 0, 0])
    ctx.fill()

    // Bar
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0])
    ctx.fill()

    // Value label
    ctx.fillStyle = '#6B6560'
    ctx.font = `${Math.max(10, barWidth * 0.45)}px "DM Sans", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(String(arr[i]), x + barWidth / 2, y - 6)
  }
}

/* ───────── Component ───────── */

export default function AlgorithmTeaching() {
  const [selectedAlgo, setSelectedAlgo] = useState(algorithms[0])
  const [steps, setSteps] = useState<AlgoStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(500) // ms per step
  const [arraySize, setArraySize] = useState(12)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generateArray = useCallback((size: number) => {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 10)
  }, [])

  const initAlgorithm = useCallback((algo: AlgorithmDef, size: number) => {
    const arr = generateArray(size)
    const newSteps = algo.generateSteps(arr)
    setSteps(newSteps)
    setCurrentStep(0)
    setIsPlaying(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [generateArray])

  // Initialize
  useEffect(() => {
    initAlgorithm(selectedAlgo, arraySize)
  }, [])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || steps.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    drawBars(ctx, steps[currentStep], rect.width, rect.height)
  }, [currentStep, steps])

  // Auto-play
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= steps.length - 1) {
            setIsPlaying(false)
            return s
          }
          return s + 1
        })
      }, speed)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, speed, steps.length])

  const handleAlgoChange = (algo: AlgorithmDef) => {
    setSelectedAlgo(algo)
    initAlgorithm(algo, arraySize)
  }

  const handleReset = () => {
    initAlgorithm(selectedAlgo, arraySize)
  }

  const handleSizeChange = (size: number) => {
    setArraySize(size)
    initAlgorithm(selectedAlgo, size)
  }

  const step = steps[currentStep]

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          算法可视化教学
        </div>
        <Title level={3} style={{ margin: 0 }}>算法演示与分析</Title>
        <Paragraph style={{ marginTop: 8, color: 'var(--ink-secondary)', maxWidth: 600 }}>
          通过高清动画直观理解经典算法的执行过程，逐步观察每一步操作，深入掌握算法原理。
        </Paragraph>
      </div>

      {/* Algorithm selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {algorithms.map((algo) => (
          <button
            key={algo.key}
            onClick={() => handleAlgoChange(algo)}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              border: `1px solid ${selectedAlgo.key === algo.key ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedAlgo.key === algo.key ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: selectedAlgo.key === algo.key ? 'var(--accent)' : 'var(--ink-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: selectedAlgo.key === algo.key ? 600 : 400,
              transition: 'all 150ms ease',
            }}
          >
            {algo.name}
            <Tag style={{
              marginLeft: 8, fontSize: 10, border: 'none',
              background: 'rgba(0,0,0,0.04)', color: 'var(--ink-tertiary)',
            }}>
              {algo.complexity}
            </Tag>
          </button>
        ))}
      </div>

      {/* Main content: canvas + code */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Canvas area */}
        <div style={{
          flex: 1,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {/* Step description */}
          {step && (
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-muted)',
              fontSize: 13,
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-mono)',
              minHeight: 48,
              display: 'flex',
              alignItems: 'center',
            }}>
              <ThunderboltOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
              {step.description}
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 320, display: 'block' }}
          />
          {/* Legend */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: 'var(--ink-tertiary)',
          }}>
            {Object.entries(BAR_COLORS).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                {{ default: '未处理', highlighted: '当前', comparing: '比较中', sorted: '已排序', pivot: '基准' }[key]}
              </div>
            ))}
          </div>
        </div>

        {/* Code panel */}
        <div style={{
          width: 280,
          background: '#1E1E1E',
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '10px 16px',
            background: '#2D2D2D',
            fontSize: 11,
            color: '#9C9590',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            算法代码
          </div>
          <pre style={{
            padding: 16,
            margin: 0,
            fontSize: 12,
            lineHeight: 1.7,
            color: '#D4D4D4',
            fontFamily: 'var(--font-mono)',
            overflow: 'auto',
            maxHeight: 380,
          }}>
            {selectedAlgo.code}
          </pre>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        <Button
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          type="primary"
          onClick={() => {
            if (currentStep >= steps.length - 1) {
              setCurrentStep(0)
            }
            setIsPlaying(!isPlaying)
          }}
        >
          {isPlaying ? '暂停' : currentStep >= steps.length - 1 ? '重新播放' : '播放'}
        </Button>
        <Button
          icon={<StepForwardOutlined />}
          onClick={() => {
            setIsPlaying(false)
            setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
          }}
          disabled={currentStep >= steps.length - 1}
        >
          单步
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>

        <div style={{ flex: 1 }} />

        {/* Step indicator */}
        <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
          步骤 {currentStep + 1} / {steps.length}
        </Text>

        {/* Progress bar */}
        <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 2 }}>
          <div style={{
            width: `${steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0}%`,
            height: '100%',
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 150ms ease',
          }} />
        </div>
      </div>

      {/* Settings row */}
      <div style={{
        display: 'flex', gap: 32, alignItems: 'center',
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', whiteSpace: 'nowrap' }}>
            速度
          </Text>
          <Slider
            min={50} max={1000} step={50}
            value={1050 - speed}
            onChange={(v) => setSpeed(1050 - v)}
            style={{ width: 140 }}
            tooltip={{ formatter: (v) => `${Math.round(1050 - Number(v))}ms` }}
          />
          <Text style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)', width: 48 }}>
            {speed}ms
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)', whiteSpace: 'nowrap' }}>
            数组大小
          </Text>
          <Slider
            min={5} max={25} step={1}
            value={arraySize}
            onChange={handleSizeChange}
            style={{ width: 140 }}
          />
          <Text style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)', width: 24 }}>
            {arraySize}
          </Text>
        </div>
      </div>

      {/* Algorithm explanation */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: 24,
      }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-tertiary)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 12, fontWeight: 500,
        }}>
          算法说明
        </div>
        <Title level={4} style={{ marginBottom: 8 }}>{selectedAlgo.name}</Title>
        <Paragraph style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
          {selectedAlgo.description}
        </Paragraph>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Tag color="default">时间复杂度：{selectedAlgo.complexity}</Tag>
          <Tag color="default">类别：{selectedAlgo.category}</Tag>
        </div>
      </div>
    </div>
  )
}
