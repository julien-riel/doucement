/**
 * Service d'export image
 * Capture les graphiques en PNG en utilisant html2canvas
 */

import html2canvas from 'html2canvas'

/**
 * Options d'export d'image
 */
interface ExportOptions {
  /** Facteur d'échelle pour la qualité (défaut: 2 pour retina) */
  scale?: number
  /** Couleur de fond (défaut: blanc) */
  backgroundColor?: string
  /** Nom du fichier sans extension (défaut: 'chart') */
  filename?: string
}

/**
 * Résultat de l'export
 */
interface ExportResult {
  /** Succès de l'export */
  success: boolean
  /** Message d'erreur si échec */
  error?: string
  /** URL du blob créé (pour aperçu) */
  blobUrl?: string
}

/**
 * Exporte un élément HTML en image PNG
 *
 * @param element Élément HTML à capturer
 * @param options Options d'export
 * @returns Promesse avec le résultat de l'export
 *
 * @example
 * const chartRef = useRef<HTMLDivElement>(null)
 * await exportToPng(chartRef.current, { filename: 'progression' })
 */
export async function exportToPng(
  element: HTMLElement | null,
  options: ExportOptions = {}
): Promise<ExportResult> {
  if (!element) {
    return {
      success: false,
      error: "L'élément à capturer n'existe pas",
    }
  }

  const { scale = 2, backgroundColor = '#FFFFFF', filename = 'chart' } = options

  try {
    // Capturer l'élément avec html2canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
      // Ignorer les éléments avec data-html2canvas-ignore
      ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
    })

    // Convertir en blob PNG
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) {
      return {
        success: false,
        error: 'Échec de la conversion en image',
      }
    }

    // Télécharger automatiquement
    downloadBlob(blob, `${filename}.png`)

    // Retourner le succès avec l'URL du blob pour aperçu
    const blobUrl = URL.createObjectURL(blob)

    return {
      success: true,
      blobUrl,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return {
      success: false,
      error: `Échec de l'export: ${message}`,
    }
  }
}

/**
 * Exporte un élément en retournant le canvas (sans téléchargement)
 * Utile pour l'intégration dans un PDF
 *
 * @param element Élément HTML à capturer
 * @param options Options d'export
 * @returns Canvas ou null en cas d'erreur
 */
export async function captureToCanvas(
  element: HTMLElement | null,
  options: Omit<ExportOptions, 'filename'> = {}
): Promise<HTMLCanvasElement | null> {
  if (!element) {
    return null
  }

  const { scale = 2, backgroundColor = '#FFFFFF' } = options

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
    })

    return canvas
  } catch {
    return null
  }
}

/**
 * Télécharge un blob comme fichier
 *
 * @param blob Blob à télécharger
 * @param filename Nom du fichier
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Libérer l'URL après un court délai
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Libère une URL de blob créée précédemment
 *
 * @param blobUrl URL à libérer
 */
export function releaseBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl)
}

/**
 * Génère un nom de fichier avec horodatage
 *
 * @param prefix Préfixe du nom de fichier
 * @returns Nom de fichier avec date
 *
 * @example
 * generateFilename('stats') // 'stats-2026-01-12'
 */
export function generateFilename(prefix: string): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${prefix}-${year}-${month}-${day}`
}
