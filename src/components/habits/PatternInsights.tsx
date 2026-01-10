import { PATTERN_ANALYSIS } from '../../constants/messages'
import type { PatternAnalysis } from '../../utils/patternAnalysis'
import { Card } from '../ui'
import './PatternInsights.css'

export interface PatternInsightsProps {
  /** Résultat de l'analyse des patterns */
  analysis: PatternAnalysis
}

/**
 * Composant affichant les insights sur les patterns d'habitudes
 * Affiche les meilleurs jours et le meilleur moment de la journée
 */
function PatternInsights({ analysis }: PatternInsightsProps) {
  if (!analysis.hasEnoughData) {
    return (
      <Card variant="default" className="pattern-insights pattern-insights--no-data">
        <p className="pattern-insights__no-data">{PATTERN_ANALYSIS.noDataYet}</p>
      </Card>
    )
  }

  return (
    <div className="pattern-insights">
      {/* Best Days */}
      {analysis.bestDays.length > 0 && (
        <Card variant="default" className="pattern-insights__card">
          <h4 className="pattern-insights__title">{PATTERN_ANALYSIS.bestDaysTitle}</h4>
          <p className="pattern-insights__intro">{PATTERN_ANALYSIS.bestDaysIntro}</p>
          <div className="pattern-insights__days">
            {analysis.bestDays.map((day, idx) => (
              <span
                key={day.dayIndex}
                className={`pattern-insights__day ${idx === 0 ? 'pattern-insights__day--best' : ''}`}
              >
                {day.dayName}
                <span className="pattern-insights__day-score">
                  {Math.round(day.averageCompletion)}%
                </span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Best Time of Day */}
      {analysis.bestTimeOfDay && (
        <Card variant="default" className="pattern-insights__card">
          <h4 className="pattern-insights__title">{PATTERN_ANALYSIS.bestTimeTitle}</h4>
          <p className="pattern-insights__intro">{PATTERN_ANALYSIS.bestTimeIntro}</p>
          <div className="pattern-insights__times">
            {analysis.timeOfDayStats.map((time) => (
              <div
                key={time.period}
                className={`pattern-insights__time ${time.period === analysis.bestTimeOfDay?.period ? 'pattern-insights__time--best' : ''}`}
              >
                <span className="pattern-insights__time-label">{time.label}</span>
                <div className="pattern-insights__time-bar">
                  <div
                    className="pattern-insights__time-fill"
                    style={{ width: `${Math.round(time.percentage)}%` }}
                  />
                </div>
                <span className="pattern-insights__time-value">{Math.round(time.percentage)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default PatternInsights
