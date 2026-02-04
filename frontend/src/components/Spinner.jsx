export default function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg
      className="spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <Spinner size={32} />
      <span>{message}</span>
    </div>
  );
}

export function ButtonSpinner() {
  return <Spinner size={16} color="white" />;
}
