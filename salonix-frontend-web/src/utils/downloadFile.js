/**
 * Download a file by fetching it and creating a blob URL.
 * This works around iOS PWA standalone mode blocking target="_blank" downloads.
 *
 * @param {string} url - The URL to download
 * @param {string} filename - The filename to save as
 * @returns {Promise<void>}
 */
export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
