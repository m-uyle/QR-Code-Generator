export const defaultState = {
  contentType: "url",
  isTransparent: false,
  codeStyle: "classic",
  eyeChoice: "default",
  eyeShape: "square",
  moduleShape: "square",
  moduleRadius: 0,
  margin: 4,
  eccLevel: "M",
  customLogoUrl: null,
  logoBadgeShape: "square",
  iconSize: "medium",
  builtinIcon: false,
};

export const STATE_ENUMS = {
  codeStyle: ["classic", "rounded"],
  eyeChoice: ["default", "circle", "leaf"],
  moduleShape: ["square", "soft", "dots"],
  eyeShape: ["square", "rounded", "circle", "leaf"],
  eccLevel: ["L", "M", "Q", "H"],
  logoBadgeShape: ["square", "circle"],
  iconSize: ["small", "medium", "large"],
  contentType: ["url", "tel", "wifi", "email", "sms", "text", "vcard", "geo"],
};

export const TYPE_ICONS = {
  url: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  tel: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  email:
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  text: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/>',
  vcard:
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  geo: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
};

export const STYLE_KEYS = [
  "codeStyle",
  "eyeChoice",
  "moduleShape",
  "eyeShape",
  "moduleRadius",
  "margin",
  "eccLevel",
  "logoBadgeShape",
  "iconSize",
  "builtinIcon",
  "isTransparent",
  "customLogoUrl",
];

export const STYLE_LABELS = {
  codeStyle: "geometry style",
  eyeChoice: "corner eyes",
  moduleShape: "module style",
  eyeShape: "corner eyes",
  moduleRadius: "smoothness",
  margin: "quiet zone",
  eccLevel: "error correction",
  logoBadgeShape: "emblem shape",
  iconSize: "emblem size",
  builtinIcon: "type icon",
  isTransparent: "transparency",
  customLogoUrl: "emblem",
};
