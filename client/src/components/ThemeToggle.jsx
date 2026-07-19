import './ThemeToggle.css';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`stt-track ${isDark ? 'stt-dark' : ''}`}
      onClick={toggle}
    >
      <span className="stt-sky stt-sky-day" aria-hidden="true">
        <span className="stt-cloud stt-cloud-a" />
        <span className="stt-cloud stt-cloud-b" />
      </span>
      <span className="stt-sky stt-sky-night" aria-hidden="true">
        <span className="stt-star" style={{ top: '20%', left: '22%', animationDelay: '0s' }} />
        <span className="stt-star" style={{ top: '55%', left: '14%', animationDelay: '0.6s' }} />
        <span className="stt-star" style={{ top: '32%', left: '78%', animationDelay: '1.1s' }} />
        <span className="stt-star" style={{ top: '68%', left: '70%', animationDelay: '1.6s' }} />
      </span>

      <span className="stt-thumb" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="stt-icon">
          <g className="stt-rays">
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1="12" y1="3.4" x2="12" y2="1"
                strokeLinecap="round"
                transform={`rotate(${i * 45} 12 12)`}
              />
            ))}
          </g>
          <circle className="stt-body" cx="12" cy="12" r="6" />
          <g className="stt-craters">
            <circle cx="9.4" cy="9.6" r="1.15" />
            <circle cx="14.1" cy="11.3" r="0.8" />
            <circle cx="10.6" cy="14.2" r="0.65" />
          </g>
        </svg>
      </span>
    </button>
  );
};

export default ThemeToggle;
