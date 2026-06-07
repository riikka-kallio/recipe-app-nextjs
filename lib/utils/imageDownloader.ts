/**
 * Download an image from a URL and convert it to a File object
 * This allows us to upload external recipe images to our own storage
 */
export async function downloadImageAsFile(
  imageUrl: string, 
  useProxy = false
): Promise<File | null> {
  try {
    console.log('Downloading image from:', imageUrl);
    
    // Use proxy if needed to bypass CORS issues
    const fetchUrl = useProxy 
      ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
    
    // Fetch the image
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch image:', response.statusText);
      return null;
    }
    
    // Get the image as a blob
    const blob = await response.blob();
    
    // Validate it's an image
    if (!blob.type.startsWith('image/')) {
      console.error('Downloaded file is not an image:', blob.type);
      return null;
    }
    
    // Extract filename from URL or use default
    let filename = 'imported-image.jpg';
    try {
      const urlPath = new URL(imageUrl).pathname;
      const extractedFilename = urlPath.split('/').pop();
      if (extractedFilename && extractedFilename.includes('.')) {
        filename = extractedFilename;
      }
    } catch (e) {
      // Use default filename if URL parsing fails
    }
    
    // Create File object from blob
    const file = new File([blob], filename, { type: blob.type });
    
    console.log('Successfully downloaded image as File:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    
    return file;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Convert a File object to a data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
