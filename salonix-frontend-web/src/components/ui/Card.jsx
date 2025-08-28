function Card({ children }) {
  return (
    <div className="bg-brand-light border border-brand-border rounded-md p-4 shadow-sm">
      {children}
    </div>
  );
}
export default Card;
