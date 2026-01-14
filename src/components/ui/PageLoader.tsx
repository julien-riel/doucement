import Skeleton from './Skeleton'
import './PageLoader.css'

/**
 * Composant PageLoader pour les routes lazy-loadées
 *
 * Affiche un skeleton loader pendant le chargement des pages.
 * Design cohérent avec le système "Soft Organic".
 *
 * @example
 * <Suspense fallback={<PageLoader />}>
 *   <LazyLoadedPage />
 * </Suspense>
 */
function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Chargement de la page...">
      {/* Simule une structure typique de page */}
      <div className="page-loader__header">
        <Skeleton variant="text" width="60%" height={32} />
      </div>
      <div className="page-loader__content">
        <Skeleton variant="card" height={100} />
        <Skeleton variant="card" height={100} />
        <Skeleton variant="card" height={100} />
      </div>
    </div>
  )
}

export default PageLoader
