import { Linking, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';

type PdfUrls = {
  url: string;
  downloadUrl: string;
  filename: string;
};

/** Always fetch a fresh PDF into a unique cache path (avoids stale Print/View). */
async function fetchPdfToCache(urls: PdfUrls): Promise<string> {
  const safeName = (urls.filename || 'VisionGrowth.pdf').replace(/[^\w.\-]+/g, '_');
  const tmp = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/vg_${Date.now()}_${safeName}`;
  if (await ReactNativeBlobUtil.fs.exists(tmp)) {
    await ReactNativeBlobUtil.fs.unlink(tmp);
  }
  // Use downloadUrl for every action so Print/View/Download/Share get the same bytes
  const res = await ReactNativeBlobUtil.config({
    fileCache: true,
    path: tmp,
  }).fetch('GET', urls.downloadUrl || urls.url);
  return res.path();
}

/**
 * Open PDF in the device’s native viewer — not Chrome —
 * so the API host never appears in the browser address bar.
 */
export async function viewPdf(urls: PdfUrls) {
  const filePath = await fetchPdfToCache(urls);

  if (Platform.OS === 'android') {
    await ReactNativeBlobUtil.android.actionViewIntent(filePath, 'application/pdf');
    return;
  }

  await Linking.openURL(filePath.startsWith('file://') ? filePath : `file://${filePath}`);
}

/**
 * Save PDF into the public Downloads folder (visible in Files / Downloads app).
 * On Android 10+ this uses MediaStore; writing DownloadDir alone often stays app-private.
 */
export async function downloadPdf(urls: PdfUrls): Promise<string> {
  const cachePath = await fetchPdfToCache(urls);

  if (Platform.OS === 'android') {
    try {
      const mediaPath = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: urls.filename,
          parentFolder: '',
          mimeType: 'application/pdf',
        },
        'Download',
        cachePath,
      );
      return mediaPath || cachePath;
    } catch {
      await ReactNativeBlobUtil.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: urls.filename,
          description: 'VISION Growth Card PDF',
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', urls.downloadUrl || urls.url);
      return urls.filename;
    }
  }

  const dest = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${urls.filename}`;
  if (await ReactNativeBlobUtil.fs.exists(dest)) {
    await ReactNativeBlobUtil.fs.unlink(dest);
  }
  await ReactNativeBlobUtil.fs.cp(cachePath, dest);
  return dest;
}

/**
 * Native share sheet (WhatsApp, Gmail, Drive…) with the PDF file —
 * not a Chrome URL open.
 */
export async function sharePdfFile(urls: PdfUrls, message?: string) {
  const filePath = await fetchPdfToCache(urls);
  const fileUrl = Platform.OS === 'android' ? `file://${filePath}` : filePath;

  await Share.open({
    title: urls.filename,
    subject: urls.filename,
    message: message || 'VISION Growth Card',
    url: fileUrl,
    type: 'application/pdf',
    filename: urls.filename.replace(/\.pdf$/i, ''),
    failOnCancel: false,
  });
}
