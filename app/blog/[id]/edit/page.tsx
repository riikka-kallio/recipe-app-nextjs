'use client';

import { useParams } from 'next/navigation';
import { BlogPostForm } from '@/components/BlogPostForm';

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <BlogPostForm blogPostId={Number(id)} />;
}
