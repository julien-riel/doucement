import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './MainLayout.css'

export interface MainLayoutProps {
  /** Contenu principal de la page */
  children: ReactNode
  /** Masquer la navigation (ex: onboarding) */
  hideNavigation?: boolean
}

/**
 * Layout principal de l'application
 *
 * Inclut :
 * - Zone de contenu scrollable
 * - Barre de navigation bottom avec 3 onglets
 *
 * @example
 * <MainLayout>
 *   <TodayContent />
 * </MainLayout>
 */
function MainLayout({ children, hideNavigation = false }: MainLayoutProps) {
  const { t } = useTranslation()
  return (
    <div className="main-layout">
      <main className="main-layout__content">{children}</main>
      {!hideNavigation && (
        <nav className="main-layout__nav" aria-label="Navigation principale">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item__icon" aria-hidden="true">
              ☀️
            </span>
            <span className="nav-item__label">{t('navigation.today')}</span>
          </NavLink>
          <NavLink
            to="/statistics"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item__icon" aria-hidden="true">
              📊
            </span>
            <span className="nav-item__label">{t('navigation.statistics')}</span>
          </NavLink>
          <NavLink
            to="/habits"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          >
            <span className="nav-item__icon" aria-hidden="true">
              🎯
            </span>
            <span className="nav-item__label">{t('navigation.habits')}</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}

export default MainLayout
