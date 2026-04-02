import { resolveTenantAssetUrl } from '../../utils/tenant';

function Avatar({ src, alt = 'Avatar' }) {
  const resolvedSrc = resolveTenantAssetUrl(src);

  return (
    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : null}
    </div>
  );
}
export default Avatar;
