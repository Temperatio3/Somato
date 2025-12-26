import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Une erreur est survenue</h1>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 mb-6">
                        <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
                    </div>
                    <details className="whitespace-pre-wrap font-mono text-xs bg-slate-100 p-4 rounded overflow-auto max-h-96">
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Rafraîchir la page
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="mt-6 ml-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                    >
                        Réinitialiser les données (Attention: efface tout)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
