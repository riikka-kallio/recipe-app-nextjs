import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/apiHelpers';
import { aiService } from '@/lib/services/aiService';

// Dynamic import for pdf-parse (CommonJS module)
const getPdfParse = async () => {
  const pdfParse = await import('pdf-parse');
  return (pdfParse as any).default || pdfParse;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return createErrorResponse('PDF file is required', 400);
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    return createErrorResponse('File must be a PDF', 400);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return createErrorResponse('PDF size exceeds 10MB limit', 400);
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      return createErrorResponse('No text found in PDF', 400);
    }

    // Use AI to parse recipe from extracted text
    const recipe = await aiService.parseRecipeFromText(text);

    return createSuccessResponse(recipe, 'Recipe imported from PDF successfully');
  } catch (error: any) {
    console.error('Error importing from PDF:', error);
    return createErrorResponse(error.message || 'Failed to import PDF', 500);
  }
});
