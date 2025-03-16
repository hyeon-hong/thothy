"use client";

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Header from "../../components/Header";
import { Container, Typography, Box, TextField } from '@mui/material';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import LoginDialog from '@/components/LoginDialog';

// Toolbar button component
const ToolbarButton = ({ 
  onClick, 
  active = false, 
  children 
}: { 
  onClick: () => void; 
  active?: boolean; 
  children: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-100 ${
      active ? 'bg-gray-200' : ''
    }`}
  >
    {children}
  </button>
);

export default function BlogEditPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-4 py-2',
      },
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    checkUser();
  }, []);

  const handleBack = () => {
    router.push('/blog');
  };

  const handleSave = async () => {
    if (!editor) return;
    
    if (!userId) {
      setShowLoginDialog(true);
      return;
    }
    
    setIsLoading(true);
    const content = editor.getHTML();
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('blogs')
        .insert({
          title,
          content,
          user_id: userId
        });

      if (error) throw error;
      
      router.push('/blog');
    } catch (error) {
      console.error('Error saving blog:', error);
      // TODO: Add error handling UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="blog" />
      
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Typography variant="h4" component="h1">
              New Blog Post
            </Typography>
          </Box>
          <Button 
            onClick={handleSave} 
            className="gap-2"
            disabled={isLoading || !title.trim()}
          >
            <Save className="h-4 w-4" /> {isLoading ? 'Saving...' : 'Save Post'}
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Blog Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 4 }}
          />

          <div className="border rounded-lg overflow-hidden">
            <div className="border-b bg-gray-50 p-2 flex gap-2">
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive('bold')}
              >
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive('italic')}
              >
                <span className="italic">I</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor?.isActive('heading', { level: 2 })}
              >
                H2
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')}
              >
                •
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                active={editor?.isActive('orderedList')}
              >
                1.
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                active={editor?.isActive('blockquote')}
              >
                ""
              </ToolbarButton>
            </div>
            <EditorContent editor={editor} />
          </div>
        </Box>
      </Container>

      <LoginDialog 
        isOpen={showLoginDialog} 
        onClose={() => setShowLoginDialog(false)} 
      />
    </div>
  );
} 