/**
 * Render a unified accessible toggle switch with label on the left.
 *
 * @param {Object} props
 * @param {string} props.id - Input ID for form bindings
 * @param {string} props.label - Visible label text displayed on the left
 * @param {string} [props.title] - Hover title / tooltip text
 * @param {string} [props.ariaLabel] - Accessible aria-label
 * @param {boolean} [props.checked=false] - Initial checked state
 * @param {string} [props.className=""] - Optional additional CSS class for wrapper
 * @returns {string} HTML string
 */
export const renderToggleSwitch = ({
  id,
  label,
  title = "",
  ariaLabel = "",
  checked = false,
  className = "",
} = {}) => {
  const titleAttr = title ? ` title="${title}"` : "";
  const ariaAttr = ariaLabel
    ? ` aria-label="${ariaLabel}"`
    : ` aria-label="${label}"`;
  const checkedAttr = checked ? " checked" : "";
  const extraClass = className ? ` ${className}` : "";

  return `
    <label class="toggle-switch${extraClass}"${titleAttr}>
      <span class="toggle-switch-label">${label}</span>
      <span class="toggle-switch-control">
        <input type="checkbox" id="${id}" class="sr-only toggle-switch-input"${ariaAttr}${checkedAttr}>
        <span class="toggle-switch-track" aria-hidden="true">
          <span class="toggle-switch-thumb"></span>
        </span>
      </span>
    </label>
  `.trim();
};
