"use client";

import React, { useEffect, useState } from 'react';
import Header from "../../components/Header";
import { Container, Typography, Box } from '@mui/material';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface PageParams {
  id: string;
}

export default function BlogPostPage({ params }: { params: Promise<PageParams> }) {
  const unwrappedParams = React.use(params) as PageParams;
  const router = useRouter();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch the blog post
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', unwrappedParams.id)
        .single();

      if (error) {
        console.error('Error fetching blog:', error);
        router.push('/blog');
        return;
      }

      setBlog(data);
      setIsOwner(user?.id === data.user_id);
      setIsLoading(false);
    };

    fetchBlog();
  }, [unwrappedParams.id, router]);

  const handleBack = () => {
    router.push('/blog');
  };

  const handleEdit = () => {
    router.push(`/blog/edit/${unwrappedParams.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentView="blog" />
        <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
          <Typography>Loading...</Typography>
        </Container>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentView="blog" />
        <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
          <Typography>Blog post not found</Typography>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="blog" />
      
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Box>
          {isOwner && (
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" /> Edit Post
            </Button>
          )}
        </Box>

        <article className="prose prose-lg max-w-none">
          <Typography variant="h2" component="h1" gutterBottom>
            {blog.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {new Date(blog.created_at).toLocaleDateString()}
          </Typography>
          <div 
            className="mt-8"
            dangerouslySetInnerHTML={{ __html: blog.content }} 
          />
        </article>
      </Container>
    </div>
  );
} 