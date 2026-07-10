import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error) {
    this.setState({ error: error.message })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Error:</h2>
          <p>{this.state.error}</p>
          <button type="button" onClick={() => this.setState({ error: null })}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
