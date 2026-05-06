# FEW-SEC-05 Item 2: CSP Component Review

## Audit Findings

### Components Using External Scripts

#### 1. CaptchaGate.jsx
- **Location**: `src/components/security/CaptchaGate.jsx`
- **Purpose**: Loads Turnstile (Cloudflare) and hCaptcha scripts dynamically
- **Current Implementation**:
  ```javascript
  function loadScript(src) {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  }
  ```
- **CSP Risk**: Scripts are loaded without nonce attributes
- **Status**: ⚠️ Requires nonce support

#### 2. Google Analytics (gtag)
- **Locations**: 
  - `src/pages/Settings.jsx` (line 219-220)
  - `src/components/ui/LanguageToggle.jsx` (line 49-50)
- **Current Implementation**: Accesses `window.gtag` but no initialization found
- **CSP Risk**: gtag script not loaded via any visible mechanism; likely external script manager or missing initialization
- **Status**: ⚠️ Requires initialization with nonce + CSP header

#### 3. Inline Script in index.html
- **Location**: `index.html` (lines 12-20)
- **Purpose**: Dynamic manifest switching based on pathname
- **Content**:
  ```javascript
  if (window.location.pathname.startsWith('/ops')) {
    // Updates manifest, title, apple-web-app-title
  }
  ```
- **CSP Risk**: Inline script without nonce
- **Status**: ⚠️ Requires nonce attribute

#### 4. App.jsx TenantThemeManager
- **Location**: `src/App.jsx`
- **Purpose**: Dynamically manages PWA manifest, favicon, theme variables
- **Implementation**: Uses `document.createElement()` and property manipulation
- **CSP Risk**: DOM manipulation is safe; metadata updates don't violate CSP
- **Status**: ✅ Compliant (no script execution)

### Inline Styles
- **Status**: ✅ Compliant - React inline styles (style={{}}) are allowed under standard CSP

### Regex/String Event Handlers
- **Status**: ✅ Compliant - No dangerouslySetInnerHTML or string-based event handlers found

---

## Recommendations

### 1. Add CSP Meta Tag
Add strict CSP policy to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' https://challenges.cloudflare.com https://js.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'nonce-{NONCE}' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' https: data:;
  connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
  frame-src 'self';
  object-src 'none';
  upgrade-insecure-requests;
">
```

### 2. Update CaptchaGate.jsx
- Accept nonce from props or global context
- Pass nonce to dynamically created script tags
- Add integrity attributes where possible

### 3. Initialize Google Analytics with Nonce
- Create dedicated analytics initialization component
- Load gtag script with nonce attribute
- Document expected script src from Google

### 4. Generate Nonce in HTML
- Backend or build process generates unique nonce per request
- Inject nonce into HTML template
- Expose nonce to React via window object or meta tag

---

## Implementation Status

- [ ] Add CSP meta tag to index.html
- [ ] Update inline script in index.html with nonce
- [ ] Create Analytics initialization component
- [ ] Update CaptchaGate.jsx to support nonce
- [ ] Document nonce generation strategy
- [ ] Test with CSP violations reporter
- [ ] Verify all external scripts load correctly
