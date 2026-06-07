export async function exportCanvasPng(node: HTMLElement, filename: string, skipSave = false) {
  const [{ domToJpeg }, fileSaver] = await Promise.all([
    import('modern-screenshot'),
    skipSave ? Promise.resolve(null) : import('file-saver')
  ]);

  const imgs = Array.from(node.querySelectorAll('img'));

  try {
    await Promise.race([
      Promise.all(imgs.map(img => img.complete ? Promise.resolve() : img.decode().catch(() => { }))),
      new Promise(r => setTimeout(r, 2000))
    ]);

    const dataUrl = await domToJpeg(node, {
      scale: 3.5,
      quality: 0.9,
      width: 360,
      height: 640,
      backgroundColor: '#ffffff',
    });

    if (!dataUrl || dataUrl.length < 15000) {
      throw new Error(`Invalid dataUrl generated (length: ${dataUrl?.length ?? 0})`);
    }

    if (!skipSave && fileSaver?.saveAs) {
      fileSaver.saveAs(dataUrl, filename);
    }

    return dataUrl;
  } catch (err) {
    console.error('[StoryGenerator] Capture failed:', err);
    throw err;
  }
}
