import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends React.Component<any, any> {
  state: any;
  props: any;

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: any): any {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong. Please try again later.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error) {
          displayMessage = `Database Error: ${parsed.error}. Please check your permissions.`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Oops! An error occurred</h2>
            <p className="text-neutral-600 mb-8">{displayMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
