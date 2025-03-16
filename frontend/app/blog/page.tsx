"use client";

import React, { useEffect, useState } from 'react';
import Header from "../components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container, Typography, Grid, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blogs:', error);
        return;
      }

      setBlogPosts(data || []);
      setIsLoading(false);
    };

    fetchBlogs();
  }, []);

  const handleNewBlog = () => {
    router.push('/blog/edit');
  };

  // Function to get reading time estimate
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Function to get a preview of the content
  const getContentPreview = (content: string) => {
    // Remove HTML tags and get first 150 characters
    const plainText = content.replace(/<[^>]+>/g, '');
    return plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="blog" />
      
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          mt: 2
        }}>
          <div>
            <Typography variant="h2" component="h1" gutterBottom>
              Blog
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore the latest insights, tutorials, and updates from the Thothy team.
            </Typography>
          </div>
          <div className="flex items-center">
            <Button 
              onClick={handleNewBlog}
              className="gap-2"
              variant="default"
              size="lg"
            >
              <Plus className="h-4 w-4" /> New Blog
            </Button>
          </div>
        </Box>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {isLoading ? (
            <Grid item xs={12}>
              <Typography>Loading blogs...</Typography>
            </Grid>
          ) : blogPosts.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No blog posts yet. Be the first to create one!</Typography>
            </Grid>
          ) : (
            blogPosts.map((post) => (
              <Grid item xs={12} md={6} lg={4} key={post.id}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      {new Date(post.created_at).toLocaleDateString()} • {getReadingTime(post.content)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {getContentPreview(post.content)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/blog/${post.id}`)}
                    >
                      Read More
                    </Button>
                  </CardFooter>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </div>
  );
} 