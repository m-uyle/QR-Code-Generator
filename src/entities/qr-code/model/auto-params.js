/**
 * Auto-calculation of Error Correction Code (ECC) and Quiet Zone margin.
 *
 * Designed around opinionated UX defaults:
 * - Emblems require high error recovery (Q = 25%).
 * - Dense or long payloads reduce margin to 2 modules to prevent micro-modules.
 * - Standard payloads use 4 modules (ISO/IEC 18004) and Level M (15%).
 */

export function getAutoEcc(payload, hasLogo) {
  if (hasLogo) {
    return "Q";
  }
  if (typeof payload === "string" && payload.length > 160) {
    return "L";
  }
  return "M";
}

export function getAutoMargin(moduleCount, payloadLength = 0) {
  if (moduleCount > 37 || payloadLength > 120) {
    return 2;
  }
  return 4;
}
