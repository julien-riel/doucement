/**
 * Page Guide utilisateur
 * Affiche le contenu du guide in-app, accessible depuis les Paramètres
 */
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import './UserGuide.css'

interface GuideItem {
  title: string
  text: string
}

/**
 * Composant pour une section du guide avec ses sous-éléments
 */
function GuideSection({ title, items }: { title: string; items: GuideItem[] }) {
  return (
    <section className="user-guide__section">
      <h2 className="user-guide__section-title">{title}</h2>
      {items.map((item) => (
        <Card key={item.title} variant="default" className="user-guide__card">
          <h3 className="user-guide__card-title">{item.title}</h3>
          <p className="user-guide__card-text">{item.text}</p>
        </Card>
      ))}
    </section>
  )
}

function UserGuide() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const sections = [
    {
      title: t('userGuide.sections.concepts.title'),
      items: [
        {
          title: t('userGuide.sections.concepts.dose.title'),
          text: t('userGuide.sections.concepts.dose.text'),
        },
        {
          title: t('userGuide.sections.concepts.progression.title'),
          text: t('userGuide.sections.concepts.progression.text'),
        },
        {
          title: t('userGuide.sections.concepts.partial.title'),
          text: t('userGuide.sections.concepts.partial.text'),
        },
      ],
    },
    {
      title: t('userGuide.sections.gettingStarted.title'),
      items: [
        {
          title: t('userGuide.sections.gettingStarted.create.title'),
          text: t('userGuide.sections.gettingStarted.create.text'),
        },
        {
          title: t('userGuide.sections.gettingStarted.today.title'),
          text: t('userGuide.sections.gettingStarted.today.text'),
        },
      ],
    },
    {
      title: t('userGuide.sections.daily.title'),
      items: [
        {
          title: t('userGuide.sections.daily.checkIn.title'),
          text: t('userGuide.sections.daily.checkIn.text'),
        },
        {
          title: t('userGuide.sections.daily.missedDay.title'),
          text: t('userGuide.sections.daily.missedDay.text'),
        },
      ],
    },
    {
      title: t('userGuide.sections.tracking.title'),
      items: [
        {
          title: t('userGuide.sections.tracking.simple.title'),
          text: t('userGuide.sections.tracking.simple.text'),
        },
        {
          title: t('userGuide.sections.tracking.detailed.title'),
          text: t('userGuide.sections.tracking.detailed.text'),
        },
        {
          title: t('userGuide.sections.tracking.counter.title'),
          text: t('userGuide.sections.tracking.counter.text'),
        },
        {
          title: t('userGuide.sections.tracking.stopwatch.title'),
          text: t('userGuide.sections.tracking.stopwatch.text'),
        },
        {
          title: t('userGuide.sections.tracking.timer.title'),
          text: t('userGuide.sections.tracking.timer.text'),
        },
        {
          title: t('userGuide.sections.tracking.slider.title'),
          text: t('userGuide.sections.tracking.slider.text'),
        },
      ],
    },
    {
      title: t('userGuide.sections.features.title'),
      items: [
        {
          title: t('userGuide.sections.features.weekly.title'),
          text: t('userGuide.sections.features.weekly.text'),
        },
        {
          title: t('userGuide.sections.features.stacking.title'),
          text: t('userGuide.sections.features.stacking.text'),
        },
        {
          title: t('userGuide.sections.features.pauses.title'),
          text: t('userGuide.sections.features.pauses.text'),
        },
        {
          title: t('userGuide.sections.features.celebrations.title'),
          text: t('userGuide.sections.features.celebrations.text'),
        },
      ],
    },
    {
      title: t('userGuide.sections.data.title'),
      items: [
        {
          title: t('userGuide.sections.data.privacy.title'),
          text: t('userGuide.sections.data.privacy.text'),
        },
        {
          title: t('userGuide.sections.data.export.title'),
          text: t('userGuide.sections.data.export.text'),
        },
      ],
    },
  ]

  const tips = [
    t('userGuide.sections.tips.startSmall'),
    t('userGuide.sections.tips.fewHabits'),
    t('userGuide.sections.tips.trustProcess'),
  ]

  return (
    <div className="page page-user-guide">
      <header className="user-guide__header">
        <Button variant="ghost" size="small" onClick={() => navigate('/settings')}>
          {t('common.back')}
        </Button>
        <h1 className="user-guide__title">{t('userGuide.title')}</h1>
      </header>

      {sections.map((section) => (
        <GuideSection key={section.title} title={section.title} items={section.items} />
      ))}

      <section className="user-guide__section">
        <h2 className="user-guide__section-title">{t('userGuide.sections.tips.title')}</h2>
        <Card variant="default" className="user-guide__tips-card">
          <ul className="user-guide__tips-list">
            {tips.map((tip) => (
              <li key={tip} className="user-guide__tip">
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}

export default UserGuide
