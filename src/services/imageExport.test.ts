/**
 * Tests unitaires du service d'export d'images
 * Phase 13 - Export Visuel Partageable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  exportElementAsImage,
  generateImageBlob,
  generateImageFile,
  canShareFiles,
  shareImage,
  type ImageExportOptions,
} from './imageExport'

// ============================================================================
// MOCKS
// ============================================================================

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(),
}))

import html2canvas from 'html2canvas'

/**
 * Crée un mock de HTMLCanvasElement avec toBlob
 */
function createMockCanvas(blobResult: Blob | null = new Blob(['test'], { type: 'image/png' })) {
  return {
    toBlob: vi.fn((callback: BlobCallback, _mimeType?: string, _quality?: number) => {
      callback(blobResult)
    }),
  }
}

/**
 * Crée un élément DOM de test
 */
function createMockElement(): HTMLElement {
  const element = document.createElement('div')
  element.className = 'shareable-card'
  element.textContent = 'Test content'
  return element
}

// ============================================================================
// TESTS: canShareFiles
// ============================================================================

describe('canShareFiles', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('returns true when navigator.share and navigator.canShare are available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        share: vi.fn(),
        canShare: vi.fn(),
      },
      writable: true,
    })

    expect(canShareFiles()).toBe(true)
  })

  it('returns false when navigator.share is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        canShare: vi.fn(),
      },
      writable: true,
    })

    expect(canShareFiles()).toBe(false)
  })

  it('returns false when navigator.canShare is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        share: vi.fn(),
      },
      writable: true,
    })

    expect(canShareFiles()).toBe(false)
  })

  it('returns false when navigator is undefined', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
    })

    expect(canShareFiles()).toBe(false)
  })
})

// ============================================================================
// TESTS: generateImageBlob
// ============================================================================

describe('generateImageBlob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates a blob from an element', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await generateImageBlob(element)

    expect(result).toBe(mockBlob)
    expect(html2canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        scale: 2,
        backgroundColor: '#FDFCFB',
        useCORS: true,
        allowTaint: false,
        logging: false,
      })
    )
  })

  it('uses custom options when provided', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const options: ImageExportOptions = {
      scale: 3,
      backgroundColor: '#FFFFFF',
      format: 'jpeg',
      quality: 0.8,
    }

    await generateImageBlob(element, options)

    expect(html2canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        scale: 3,
        backgroundColor: '#FFFFFF',
      })
    )
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8)
  })

  it('rejects when blob generation fails', async () => {
    const mockCanvas = createMockCanvas(null)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()

    await expect(generateImageBlob(element)).rejects.toThrow("Échec de la génération de l'image")
  })

  it('uses PNG format by default', async () => {
    const mockCanvas = createMockCanvas()
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await generateImageBlob(element)

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.95)
  })
})

// ============================================================================
// TESTS: generateImageFile
// ============================================================================

describe('generateImageFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date for consistent timestamps
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-11'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates a file with correct name and type', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await generateImageFile(element)

    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('doucement-progression-2026-01-11.png')
    expect(result.type).toBe('image/png')
  })

  it('uses custom filename when provided', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await generateImageFile(element, { filename: 'custom-name' })

    expect(result.name).toBe('custom-name-2026-01-11.png')
  })

  it('uses JPEG extension for JPEG format', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await generateImageFile(element, { format: 'jpeg' })

    expect(result.name).toBe('doucement-progression-2026-01-11.jpg')
    expect(result.type).toBe('image/jpeg')
  })
})

// ============================================================================
// TESTS: exportElementAsImage
// ============================================================================

describe('exportElementAsImage', () => {
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> }
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-11'))

    // Mock link element
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    // Mock document methods
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
    appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as unknown as HTMLElement)
    removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as unknown as HTMLElement)

    // Mock URL methods
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('creates and clicks a download link', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await exportElementAsImage(element)

    // Wait for async blob callback
    await vi.waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled()
    })

    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob)
    expect(mockLink.href).toBe('blob:test-url')
    expect(mockLink.download).toBe('doucement-progression-2026-01-11.png')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')
  })

  it('uses custom filename in download', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await exportElementAsImage(element, { filename: 'my-progress' })

    await vi.waitFor(() => {
      expect(mockLink.download).toBe('my-progress-2026-01-11.png')
    })
  })

  it('does not trigger download when blob is null', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockCanvas = createMockCanvas(null)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await exportElementAsImage(element)

    // The function is async and canvas.toBlob is sync in our mock
    // so we just need to wait for the next tick
    await vi.runAllTimersAsync()

    expect(mockLink.click).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith("Échec de la génération de l'image")

    consoleErrorSpy.mockRestore()
  })
})

// ============================================================================
// TESTS: shareImage
// ============================================================================

describe('shareImage', () => {
  const originalNavigator = global.navigator

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-11'))
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('falls back to download when Web Share API is not available', async () => {
    // Mock no share support
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    })

    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    // Mock download functionality
    const mockLink = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const element = createMockElement()
    const result = await shareImage(element)

    expect(result).toBe(false)
    await vi.waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  it('uses Web Share API when available and supported', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    const mockCanShare = vi.fn().mockReturnValue(true)

    Object.defineProperty(global, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
    })

    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await shareImage(element, 'Mon texte de partage')

    expect(result).toBe(true)
    expect(mockCanShare).toHaveBeenCalled()
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Mon texte de partage',
        title: 'Ma progression',
      })
    )
  })

  it('falls back to download when canShare returns false', async () => {
    const mockShare = vi.fn()
    const mockCanShare = vi.fn().mockReturnValue(false)

    Object.defineProperty(global, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
    })

    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    // Mock download functionality
    const mockLink = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const element = createMockElement()
    const result = await shareImage(element)

    expect(result).toBe(false)
    expect(mockShare).not.toHaveBeenCalled()
  })

  it('returns false when user cancels share', async () => {
    const abortError = new Error('User cancelled')
    abortError.name = 'AbortError'
    const mockShare = vi.fn().mockRejectedValue(abortError)
    const mockCanShare = vi.fn().mockReturnValue(true)

    Object.defineProperty(global, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
    })

    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    const result = await shareImage(element)

    expect(result).toBe(false)
  })

  it('falls back to download on share error', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'))
    const mockCanShare = vi.fn().mockReturnValue(true)

    Object.defineProperty(global, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
    })

    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCanvas = createMockCanvas(mockBlob)
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    // Mock download functionality
    const mockLink = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLElement
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const element = createMockElement()
    const result = await shareImage(element)

    expect(result).toBe(false)
    await vi.waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled()
    })
  })
})

// ============================================================================
// TESTS: DEFAULT OPTIONS
// ============================================================================

describe('Default options', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses scale 2 for retina displays by default', async () => {
    const mockCanvas = createMockCanvas()
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await generateImageBlob(element)

    expect(html2canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        scale: 2,
      })
    )
  })

  it('uses neutral-50 background color by default', async () => {
    const mockCanvas = createMockCanvas()
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await generateImageBlob(element)

    expect(html2canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        backgroundColor: '#FDFCFB',
      })
    )
  })

  it('uses 0.95 quality by default', async () => {
    const mockCanvas = createMockCanvas()
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as unknown as HTMLCanvasElement)

    const element = createMockElement()
    await generateImageBlob(element)

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.95)
  })
})
