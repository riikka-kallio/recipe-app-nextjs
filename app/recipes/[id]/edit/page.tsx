'use client';

import { useParams } from 'next/navigation';
import { RecipeForm } from '@/components/RecipeForm';

export default function EditRecipePage() {
  const params = useParams();
  const id = params.id as string;
  
  return <RecipeForm recipeId={Number(id)} />;
}
