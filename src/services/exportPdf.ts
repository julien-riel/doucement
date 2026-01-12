/**
 * Service d'export PDF
 * Génère un PDF récapitulatif avec graphiques et statistiques
 */

import { jsPDF } from 'jspdf'
import { captureToCanvas } from './exportImage'
import { Habit, DailyEntry } from '../types'
import { StatsPeriod } from '../types/statistics'
import { getHabitStats, getProjection } from './statistics'

/**
 * Options d'export PDF
 */
export interface PdfExportOptions {
  /** Nom du fichier sans extension (défaut: 'statistiques-doucement') */
  filename?: string
  /** Période d'affichage */
  period?: StatsPeriod
  /** Inclure la section projections */
  includeProjections?: boolean
  /** Inclure le tableau récapitulatif */
  includeStatsTable?: boolean
}

/**
 * Résultat de l'export PDF
 */
export interface PdfExportResult {
  /** Succès de l'export */
  success: boolean
  /** Message d'erreur si échec */
  error?: string
}

/**
 * Couleurs du design system
 */
const COLORS = {
  primary: '#F27D16',
  secondary: '#22C55E',
  text: '#292524',
  textSecondary: '#57534E',
  background: '#FDFCFB',
  border: '#EBE8E4',
}

/**
 * Labels des périodes en français
 */
const PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  quarter: 'Ce trimestre',
  year: 'Cette année',
  all: 'Depuis le début',
}

/**
 * Génère et télécharge un PDF récapitulatif des statistiques
 *
 * @param habits Habitudes à inclure
 * @param entries Entrées quotidiennes
 * @param chartElement Élément DOM du graphique principal (optionnel)
 * @param options Options d'export
 * @returns Promesse avec le résultat de l'export
 */
export async function exportToPdf(
  habits: Habit[],
  entries: DailyEntry[],
  chartElement?: HTMLElement | null,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const {
    filename = 'statistiques-doucement',
    period = 'month',
    includeProjections = true,
    includeStatsTable = true,
  } = options

  try {
    // Créer le document PDF (format A4)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let currentY = margin

    // En-tête
    currentY = addHeader(pdf, pageWidth, margin, period)

    // Graphique principal (si fourni)
    if (chartElement) {
      currentY = await addChartSection(pdf, chartElement, pageWidth, margin, currentY)
    }

    // Vérifier si on a besoin d'une nouvelle page
    if (currentY > pageHeight - 80) {
      pdf.addPage()
      currentY = margin
    }

    // Tableau récapitulatif des statistiques
    if (includeStatsTable && habits.length > 0) {
      currentY = addStatsTable(pdf, habits, entries, period, pageWidth, margin, currentY)
    }

    // Vérifier si on a besoin d'une nouvelle page pour les projections
    if (currentY > pageHeight - 60 && includeProjections) {
      pdf.addPage()
      currentY = margin
    }

    // Section projections
    if (includeProjections && habits.length > 0) {
      currentY = addProjectionsSection(pdf, habits, entries, pageWidth, margin, currentY)
    }

    // Pied de page
    addFooter(pdf, pageWidth, pageHeight, margin)

    // Télécharger le PDF
    const timestamp = new Date().toISOString().slice(0, 10)
    pdf.save(`${filename}-${timestamp}.pdf`)

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return {
      success: false,
      error: `Échec de l'export PDF: ${message}`,
    }
  }
}

/**
 * Ajoute l'en-tête du PDF
 */
function addHeader(pdf: jsPDF, pageWidth: number, margin: number, period: StatsPeriod): number {
  let y = margin

  // Titre principal
  pdf.setFontSize(24)
  pdf.setTextColor(COLORS.text)
  pdf.text('Mes statistiques', margin, y)
  y += 10

  // Sous-titre avec la période
  pdf.setFontSize(12)
  pdf.setTextColor(COLORS.textSecondary)
  pdf.text(PERIOD_LABELS[period], margin, y)
  y += 5

  // Ligne de séparation
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 10

  return y
}

/**
 * Ajoute le graphique au PDF
 */
async function addChartSection(
  pdf: jsPDF,
  chartElement: HTMLElement,
  pageWidth: number,
  margin: number,
  startY: number
): Promise<number> {
  let y = startY

  // Titre de section
  pdf.setFontSize(14)
  pdf.setTextColor(COLORS.text)
  pdf.text('Progression', margin, y)
  y += 8

  // Capturer le graphique en canvas
  const canvas = await captureToCanvas(chartElement, {
    scale: 2,
    backgroundColor: '#FFFFFF',
  })

  if (canvas) {
    // Calculer les dimensions pour le PDF
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height / canvas.width) * imgWidth

    // Ajouter l'image au PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
    y += imgHeight + 10
  }

  return y
}

/**
 * Ajoute le tableau des statistiques
 */
function addStatsTable(
  pdf: jsPDF,
  habits: Habit[],
  entries: DailyEntry[],
  period: StatsPeriod,
  pageWidth: number,
  margin: number,
  startY: number
): number {
  let y = startY

  // Titre de section
  pdf.setFontSize(14)
  pdf.setTextColor(COLORS.text)
  pdf.text('Récapitulatif', margin, y)
  y += 8

  // Configuration du tableau
  const colWidths = {
    habit: 60,
    entries: 25,
    average: 25,
    streak: 25,
    trend: 30,
  }
  const tableWidth = pageWidth - margin * 2
  const rowHeight = 8

  // En-têtes du tableau
  pdf.setFillColor(COLORS.background)
  pdf.rect(margin, y, tableWidth, rowHeight, 'F')
  pdf.setFontSize(10)
  pdf.setTextColor(COLORS.textSecondary)

  let x = margin + 2
  pdf.text('Habitude', x, y + 5.5)
  x += colWidths.habit
  pdf.text('Entrées', x, y + 5.5)
  x += colWidths.entries
  pdf.text('Moyenne', x, y + 5.5)
  x += colWidths.average
  pdf.text('Série', x, y + 5.5)
  x += colWidths.streak
  pdf.text('Tendance', x, y + 5.5)

  y += rowHeight

  // Ligne de séparation
  pdf.setDrawColor(COLORS.border)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 2

  // Données des habitudes
  pdf.setTextColor(COLORS.text)
  const today = new Date().toISOString().slice(0, 10)

  for (const habit of habits) {
    const stats = getHabitStats(habit, entries, period, today)

    x = margin + 2
    // Nom de l'habitude (tronqué si nécessaire)
    const habitName = `${habit.emoji} ${habit.name}`
    const truncatedName = habitName.length > 20 ? habitName.slice(0, 18) + '...' : habitName
    pdf.text(truncatedName, x, y + 5.5)

    x += colWidths.habit
    pdf.text(String(stats.totalEntries), x, y + 5.5)

    x += colWidths.entries
    pdf.text(`${Math.round(stats.averageCompletion)}%`, x, y + 5.5)

    x += colWidths.average
    pdf.text(`${stats.currentStreak}j`, x, y + 5.5)

    x += colWidths.streak
    const trendText = formatTrend(stats.weeklyTrend)
    const trendColor = stats.weeklyTrend > 0 ? COLORS.secondary : COLORS.textSecondary
    pdf.setTextColor(trendColor)
    pdf.text(trendText, x, y + 5.5)
    pdf.setTextColor(COLORS.text)

    y += rowHeight
  }

  y += 5
  return y
}

/**
 * Ajoute la section des projections
 */
function addProjectionsSection(
  pdf: jsPDF,
  habits: Habit[],
  entries: DailyEntry[],
  pageWidth: number,
  margin: number,
  startY: number
): number {
  let y = startY

  // Filtrer les habitudes avec une cible définie
  const habitsWithTarget = habits.filter((h) => h.targetValue !== undefined)

  if (habitsWithTarget.length === 0) {
    return y
  }

  // Titre de section
  pdf.setFontSize(14)
  pdf.setTextColor(COLORS.text)
  pdf.text('Projections', margin, y)
  y += 10

  const today = new Date().toISOString().slice(0, 10)

  for (const habit of habitsWithTarget) {
    const projection = getProjection(habit, entries, today)

    // Nom de l'habitude
    pdf.setFontSize(11)
    pdf.setTextColor(COLORS.primary)
    pdf.text(`${habit.emoji} ${habit.name}`, margin, y)
    y += 6

    // Progression actuelle
    pdf.setFontSize(10)
    pdf.setTextColor(COLORS.text)
    pdf.text(
      `Progression: ${Math.round(projection.progressPercentage)}% (${projection.currentValue} / ${projection.targetValue} ${habit.unit})`,
      margin + 4,
      y
    )
    y += 5

    // Date estimée
    if (projection.estimatedCompletionDate && projection.daysRemaining) {
      const dateFormatted = formatDateFr(projection.estimatedCompletionDate)
      pdf.setTextColor(COLORS.secondary)
      pdf.text(
        `Objectif atteint estimé: ${dateFormatted} (dans ${projection.daysRemaining} jours)`,
        margin + 4,
        y
      )
    } else {
      pdf.setTextColor(COLORS.textSecondary)
      pdf.text('Projection non disponible (pas assez de données)', margin + 4, y)
    }

    y += 8
    pdf.setTextColor(COLORS.text)
  }

  return y
}

/**
 * Ajoute le pied de page
 */
function addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
  const y = pageHeight - margin / 2

  // Ligne de séparation
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.3)
  pdf.line(margin, y - 5, pageWidth - margin, y - 5)

  // Texte du pied de page
  pdf.setFontSize(9)
  pdf.setTextColor(COLORS.textSecondary)

  const dateStr = formatDateFr(new Date().toISOString().slice(0, 10))
  pdf.text(`Généré le ${dateStr}`, margin, y)
  pdf.text('doucement', pageWidth - margin - 20, y)
}

/**
 * Formate la tendance pour l'affichage
 */
function formatTrend(trend: number): string {
  const percentage = Math.round(trend * 100)
  if (percentage > 0) return `+${percentage}%`
  if (percentage < 0) return `${percentage}%`
  return '0%'
}

/**
 * Formate une date en français
 */
function formatDateFr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ]
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

/**
 * Génère un nom de fichier avec horodatage
 */
export function generatePdfFilename(prefix: string = 'statistiques'): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${prefix}-${year}-${month}-${day}`
}
