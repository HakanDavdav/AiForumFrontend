export default function IconActionButton({ children, className = '', style, ...props }) {
  return (
    <button
      type="button"
      className={`btn-icon icon-action-button${className ? ` ${className}` : ''}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
