export function isMobileOrTablet(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;

  const mobileOrTabletUA =
    /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );

  if (mobileOrTabletUA) {
    return true;
  }

  // iPadOS 13+ may identify itself as MacIntel.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
}
