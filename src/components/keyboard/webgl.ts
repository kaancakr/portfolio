export function isWebGLAvailable(): boolean {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!context) return false;
  // Release the probe context right away; browsers cap how many can be alive at once.
  context.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}
