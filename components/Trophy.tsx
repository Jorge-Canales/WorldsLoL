/** Copa decorativa genérica (diseño propio, no es el trofeo oficial). */
export default function Trophy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M30 14h60v38c0 20-13 34-30 34S30 72 30 52V14Z"
        fill="#fda220"
      />
      <path
        d="M30 24H14c0 22 8 34 22 38M90 24h16c0 22-8 34-22 38"
        stroke="#fda220"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M52 84h16v26H52z" fill="#e08a0c" />
      <path d="M34 110h52l6 22H28l6-22Z" fill="#fda220" />
      <rect x="24" y="132" width="72" height="14" rx="5" fill="#c26d0a" />
      <path d="M42 22v30c0 12 6 22 14 26" stroke="#ffd58a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
