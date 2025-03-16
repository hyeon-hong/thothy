"use client";

import React from 'react';
import Header from "../components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container, Typography, Grid, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

// Mock blog data - replace with real data later
const blogPosts = [
  {
    id: 1,
    title: "Getting Started with Thothy",
    description: "Learn how to make the most of Thothy's features and capabilities.",
    date: "2024-03-14",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "AI Assistants: The Future of Productivity",
    description: "Discover how AI assistants are transforming the way we work and collaborate.",
    date: "2024-03-13",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Best Practices for AI Integration",
    description: "Tips and tricks for seamlessly integrating AI into your workflow.",
    date: "2024-03-12",
    readTime: "6 min read",
  },
];

export default function BlogPage() {
  const router = useRouter();

  const handleNewBlog = () => {
    router.push('/blog/edit');
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
          {blogPosts.map((post) => (
            <Grid item xs={12} md={6} lg={4} key={post.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>{post.date} • {post.readTime}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {post.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Read More
                  </Button>
                </CardFooter>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
} 