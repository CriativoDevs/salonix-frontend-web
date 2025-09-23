function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-brand-light border border-brand-border rounded-md shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}
export default Card;
