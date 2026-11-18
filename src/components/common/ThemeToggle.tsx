import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? " is-dark" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      aria-pressed={isDark}
      title={`Switch to ${next} theme`}
    >
      <span className="theme-toggle__mode">{isDark ? "Dark" : "Light"}</span>
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb"><span>{isDark ? "☾" : "☀"}</span></span>
      </span>
    </button>
  );
}
