/**
 * Spinner di caricamento con stile coerente al design system TLCO.
 *
 * @example
 * ```tsx
 * {loading && <LoadingSpinner message="Caricamento profilo..." />}
 * ```
 */
export function LoadingSpinner({ message = "Caricamento..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 40,
        fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          border: "4px solid rgba(16, 110, 190, 0.15)",
          borderTopColor: "#106ebe",
          borderRadius: "50%",
          animation: "tlco-spin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          color: "#64748b",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        {message}
      </span>

      {/* Inline keyframes (no CSS file needed) */}
      <style>{`
        @keyframes tlco-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
