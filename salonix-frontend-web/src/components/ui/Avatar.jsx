function Avatar({ src, alt = 'Avatar' }) {
  return (
    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : null}
    </div>
  );
}
export default Avatar;
