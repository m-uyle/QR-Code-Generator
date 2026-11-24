# QR Studio

Autonomous client-side QR code generator and diagnostic studio.

## Features

### Content Types

- URL with auto-protocol handling
- Phone call link
- Wi-Fi network configuration (WPA, WEP, None)
- Email message (recipient, subject, body)
- SMS message (number, body)
- Plain text
- vCard contact card
- Geographic coordinates (latitude, longitude)

### Geometry and Style

- Module shapes: Square, Soft, Dots
- Eye shapes: Square, Rounded, Circle, Leaf
- Smoothness / corner radius: 0% to 100% in 5% increments
- Quiet zone padding: 0 to 12 modules
- Error correction levels: L (7%), M (15%), Q (25%), H (30%)
- Transparent background toggle

### Emblem and Logo

- Custom image upload (PNG, JPEG, SVG)
- Preset brand icons
- Adaptive center cutout with error recovery check
- Circular and square logo badges

### Health and Diagnostics

- In-browser scan validation via Web Worker
- Real-time contrast ratio evaluation
- Quiet zone compliance warning
- Recovery headroom estimation
- Detached inspector popover

### Export

- SVG vector download and clipboard copy
- PNG raster export with DPI metadata up to 4096 px
