import React from 'react'

const ContentLoadingContext = React.createContext(null)

/** Expõe o setter do loading da área principal (Shell). */
export function ContentLoadingProvider({ children, setPageLoading }) {
  return (
    <ContentLoadingContext.Provider value={setPageLoading}>
      {children}
    </ContentLoadingContext.Provider>
  )
}

/**
 * Mantém o overlay do `<main>` ativo enquanto `active` for true
 * (ex.: fetch inicial da página).
 */
export function useContentLoading(active) {
  const setPageLoading = React.useContext(ContentLoadingContext)

  React.useEffect(() => {
    if (!setPageLoading) return undefined
    setPageLoading(Boolean(active))
    return () => setPageLoading(false)
  }, [active, setPageLoading])
}
