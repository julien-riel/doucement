/**
 * Service d'export d'images
 * Génère des images PNG à partir d'éléments DOM
 * Phase 13 - Export Visuel Partageable
 */

import html2canvas from 'html2canvas'

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

  // Générer le canvas
  const canvas = await html2canvas(element, {
    scale: opts.scale,
    backgroundColor: opts.backgroundColor,
    useCORS: true,
    allowTaint: false,
    logging: false,
    // Assurer le rendu correct des fonts
    onclone: (clonedDoc) => {
      // Forcer les styles sur le clone pour l'export
      const clonedElement = clonedDoc.body.querySelector('.shareable-card')
      if (clonedElement instanceof HTMLElement) {
        clonedElement.style.transform = 'none'
        clonedElement.style.animation = 'none'
      }
    },
  })

  // Convertir en blob et télécharger
  const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const extension = opts.format === 'jpeg' ? 'jpg' : 'png'
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `${opts.filename}-${timestamp}.${extension}`

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error("Échec de la génération de l'image")
        return
      }

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Nettoyer
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    mimeType,
    opts.quality
  )
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

  const canvas = await html2canvas(element, {
    scale: opts.scale,
    backgroundColor: opts.backgroundColor,
    useCORS: true,
    allowTaint: false,
    logging: false,
  })

  return new Promise((resolve, reject) => {
    const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png'

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Échec de la génération de l'image"))
          return
        }
        resolve(blob)
      },
      mimeType,
      opts.quality
    )
  })
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
