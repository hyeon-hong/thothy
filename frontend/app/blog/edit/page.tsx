"use client";

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Header from "../../components/Header";
import { Container, Typography, Box, TextField } from '@mui/material';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

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
  
  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-4 py-2',
      },
    },
  });

  const handleBack = () => {
    router.push('/blog');
  };

  const handleSave = async () => {
    if (!editor) return;
    
    const content = editor.getHTML();
    // TODO: Implement save functionality
    console.log('Saving:', { title, content });
    
    // Navigate back to blog list after saving
    router.push('/blog');
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
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Post
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
    </div>
  );
} 