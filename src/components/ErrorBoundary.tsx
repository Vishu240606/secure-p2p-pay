import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Safe console log only; never expose internals to the UI.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="glass-card max-w-sm rounded-2xl p-8">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Something went wrong.
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Please try again.
          </p>
          <button
            onClick={this.reset}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
