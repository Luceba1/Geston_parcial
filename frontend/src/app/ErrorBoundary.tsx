import { Component, ReactNode } from 'react'
import { Button } from '../shared/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Algo salió mal</h1>
            <p className="text-gray-500 mb-6">
              Ocurrió un error inesperado. Recargá la página o intentá de nuevo.
            </p>
            <Button onClick={this.handleReload}>Recargar Página</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
