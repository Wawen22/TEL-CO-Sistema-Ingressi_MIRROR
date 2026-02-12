import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — cattura errori React e mostra una UI di fallback.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <Dashboard />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Errore catturato:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(120% 120% at 15% 20%, #f0f6ff 0%, #e8f0ff 34%, #edf3ff 68%, #f8fafc 100%)",
            fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
            padding: "32px",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              padding: "36px",
              background: "rgba(255, 255, 255, 0.82)",
              border: "1px solid rgba(255, 255, 255, 0.55)",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(15, 23, 42, 0.12)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>⚠️</div>
            <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "1.4rem" }}>
              Si è verificato un errore
            </h2>
            <p style={{ margin: "0 0 16px", color: "#64748b", lineHeight: 1.5 }}>
              L'applicazione ha riscontrato un problema imprevisto.
            </p>
            {this.state.error && (
              <pre
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.06)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#dc2626",
                  fontSize: "0.82rem",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 120,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #106ebe 0%, #1da4f2 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(16, 110, 190, 0.3)",
              }}
            >
              🔄 Ricarica pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
