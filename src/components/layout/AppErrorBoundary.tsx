import { Component, type ReactNode } from 'react'
import { HashRouter } from 'react-router-dom'

import { NotFoundScreen } from '@/screens/NotFoundScreen'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Renders the glitch fault page only for real runtime failures — not unknown URLs.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <HashRouter>
          <NotFoundScreen
            code="500"
            title="Something went wrong"
            description="BayouCare hit an unexpected error. Head home and try again — if it keeps happening, the server may be down."
            homeHref="/"
            homeLabel="Back home"
            browseHref="/login"
            browseLabel="Sign in"
          />
        </HashRouter>
      )
    }
    return this.props.children
  }
}
