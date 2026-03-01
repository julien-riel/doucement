/**
 * Service d'export d'images
 * Génère des images PNG à partir d'éléments DOM
 * Phase 13 - Export Visuel Partageable
 */

import * as htmlToImage from 'html-to-image'
import type { Options as HtmlToImageOptions } from 'html-to-image/lib/types'

/**
 * Options pour l'export d'image
 */
export interface ImageExportOptions {
  /** Nom du fichier (sans extension) */
  filename?: string
  /** Qualité (0-1) pour JPEG, ignoré pour PNG */
  quality?: number
  /** Format de l'image */
  format?: 'png' | 'jpeg'
  /** Échelle pour haute résolution (défaut: 2 pour retina) */
  scale?: number
  /** Couleur de fond (défaut: blanc) */
  backgroundColor?: string
}

/**
 * Options par défaut pour l'export
 */
const DEFAULT_OPTIONS: Required<ImageExportOptions> = {
  filename: 'doucement-progression',
  quality: 0.95,
  format: 'png',
  scale: 2,
  backgroundColor: '#FDFCFB', // neutral-50
}

/**
 * Construit les options html-to-image à partir de nos options internes
 */
function buildHtmlToImageOptions(opts: Required<ImageExportOptions>): HtmlToImageOptions {
  return {
    pixelRatio: opts.scale,
    backgroundColor: opts.backgroundColor,
    quality: opts.quality,
  }
}

/**
 * Génère une image à partir d'un élément DOM et la télécharge
 *
 * @param element Element DOM à capturer
 * @param options Options d'export
 * @returns Promise<void>
 */
export async function exportElementAsImage(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const htmlToImageOpts = buildHtmlToImageOptions(opts)

  const blob =
    opts.format === 'jpeg'
      ? await htmlToImage.toBlob(element, { ...htmlToImageOpts, type: 'image/jpeg' })
      : await htmlToImage.toBlob(element, { ...htmlToImageOpts, type: 'image/png' })

  if (!blob) {
    console.error("Échec de la génération de l'image")
    return
  }

  const extension = opts.format === 'jpeg' ? 'jpg' : 'png'
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `${opts.filename}-${timestamp}.${extension}`

  downloadBlob(blob, filename)
}

/**
 * Génère une image à partir d'un élément DOM et retourne le blob
 * Utile pour le partage via Web Share API
 *
 * @param element Element DOM à capturer
 * @param options Options d'export
 * @returns Promise<Blob>
 */
export async function generateImageBlob(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const htmlToImageOpts = buildHtmlToImageOptions(opts)

  const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const blob = await htmlToImage.toBlob(element, { ...htmlToImageOpts, type: mimeType })

  if (!blob) {
    throw new Error("Échec de la génération de l'image")
  }

  return blob
}

/**
 * Génère un fichier image pour le partage via Web Share API
 *
 * @param element Element DOM à capturer
 * @param options Options d'export
 * @returns Promise<File>
 */
export async function generateImageFile(
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const blob = await generateImageBlob(element, opts)

  const extension = opts.format === 'jpeg' ? 'jpg' : 'png'
  const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `${opts.filename}-${timestamp}.${extension}`

  return new File([blob], filename, { type: mimeType })
}

// ============================================================================
// CAPTURE & EXPORT (from exportImage.ts)
// ============================================================================

/**
 * Résultat de l'export PNG
 */
export interface ImageExportResult {
  /** Succès de l'export */
  success: boolean
  /** Message d'erreur si échec */
  error?: string
  /** URL du blob créé (pour aperçu) */
  blobUrl?: string
}

/**
 * Exporte un élément HTML en image PNG et le télécharge
 *
 * @param element Élément HTML à capturer
 * @param options Options d'export
 * @returns Promesse avec le résultat de l'export
 */
export async function exportToPng(
  element: HTMLElement | null,
  options: ImageExportOptions = {}
): Promise<ImageExportResult> {
  if (!element) {
    return {
      success: false,
      error: "L'élément à capturer n'existe pas",
    }
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const htmlToImageOpts: HtmlToImageOptions = {
      pixelRatio: opts.scale,
      backgroundColor: opts.backgroundColor,
      quality: 1.0,
      filter: (el: HTMLElement) => !el.hasAttribute?.('data-html2canvas-ignore'),
    }

    const blob = await htmlToImage.toBlob(element, { ...htmlToImageOpts, type: 'image/png' })

    if (!blob) {
      return {
        success: false,
        error: 'Échec de la conversion en image',
      }
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `${opts.filename}-${timestamp}.png`
    downloadBlob(blob, filename)

    const blobUrl = URL.createObjectURL(blob)
    return { success: true, blobUrl }
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
  options: Omit<ImageExportOptions, 'filename'> = {}
): Promise<HTMLCanvasElement | null> {
  if (!element) {
    return null
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const htmlToImageOpts: HtmlToImageOptions = {
      pixelRatio: opts.scale,
      backgroundColor: opts.backgroundColor,
      filter: (el: HTMLElement) => !el.hasAttribute?.('data-html2canvas-ignore'),
    }

    return await htmlToImage.toCanvas(element, htmlToImageOpts)
  } catch {
    return null
  }
}

/**
 * Télécharge un blob comme fichier
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
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Libère une URL de blob créée précédemment
 */
export function releaseBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl)
}

// ============================================================================
// SHARING
// ============================================================================

/**
 * Vérifie si l'API Web Share est disponible et supporte le partage de fichiers
 *
 * @returns boolean
 */
export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator
}

/**
 * Partage une image via l'API Web Share
 *
 * @param element Element DOM à capturer
 * @param shareText Texte accompagnant le partage
 * @param options Options d'export
 * @returns Promise<boolean> true si partagé avec succès
 */
export async function shareImage(
  element: HTMLElement,
  shareText: string = 'Ma progression avec Doucement',
  options: ImageExportOptions = {}
): Promise<boolean> {
  if (!canShareFiles()) {
    // Fallback: télécharger l'image
    await exportElementAsImage(element, options)
    return false
  }

  try {
    const file = await generateImageFile(element, options)

    const shareData: ShareData = {
      files: [file],
      text: shareText,
      title: 'Ma progression',
    }

    // Vérifier si le partage de ce type de contenu est supporté
    if (!navigator.canShare(shareData)) {
      // Fallback: télécharger
      await exportElementAsImage(element, options)
      return false
    }

    await navigator.share(shareData)
    return true
  } catch (error) {
    // L'utilisateur a annulé le partage ou erreur
    if (error instanceof Error && error.name === 'AbortError') {
      // Annulation par l'utilisateur, ce n'est pas une erreur
      return false
    }

    // Fallback: télécharger
    await exportElementAsImage(element, options)
    return false
  }
}
