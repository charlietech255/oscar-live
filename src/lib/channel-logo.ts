const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Store a compact logo in the existing logo_url field, without external image hosting. */
export async function prepareChannelLogo(file: File): Promise<string> {
  if (!supportedTypes.has(file.type)) {
    throw new Error("Chagua picha ya JPG, PNG, WEBP au GIF. Kwa HEIC, ibadilishe kuwa JPG kwanza.");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 384 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Imeshindikana kuandaa picha. Jaribu picha nyingine.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.85);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Imeshindikana")) throw error;
    throw new Error("Picha haijasomeka. Jaribu picha nyingine ya JPG au PNG.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}