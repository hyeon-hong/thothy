"use client";

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

interface HeaderProps {
  currentView: 'inbox' | 'agent' | 'find' | 'staff' | 'team' | 'blog' | 'login' | 'agents' | 'project';
}

export default function Header({ currentView }: HeaderProps) {
  const { user, signIn, signOut, loading } = useAuth();
  const router = useRouter();

  // Get user's display name and avatar
  const displayName = user?.user_metadata?.full_name || user?.email;
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Handle direct navigation
  const handleTothyClick = () => {
    router.push('/');
  };

  const handleAgentClick = () => {
    router.push('/agent');
  };

  const handleStaffClick = () => {
    router.push('/staff');
  };

  const handleBlogClick = () => {
    router.push('/blog');
  };

  const handleInboxClick = () => {
    router.push('/inbox');
  };

  const handleTeamClick = () => {
    router.push('/team');
  };

  // New handler for Project menu
  const handleProjectClick = () => {
    router.push('/project');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div 
          className="font-mono text-xl font-bold cursor-pointer"
          onClick={handleTothyClick}
        >
          Thothy
        </div>

        <nav className="flex items-center space-x-4">
          {currentView !== 'login' && (
            <>
              {user && (
                <Button
                  variant={currentView === 'inbox' ? "default" : "ghost"}
                  onClick={handleInboxClick}
                  className={currentView === 'inbox' ? "font-bold" : ""}
                >
                  Inbox
                </Button>
              )}

              <Button
                variant={(currentView === 'agent' || currentView === 'find') ? "default" : "ghost"}
                onClick={handleAgentClick}
                className={(currentView === 'agent' || currentView === 'find') ? "font-bold" : ""}
              >
                Agent
              </Button>

              {user && (
                <Button
                  variant={currentView === 'staff' ? "default" : "ghost"}
                  onClick={handleStaffClick}
                  className={currentView === 'staff' ? "font-bold" : ""}
                >
                  Staff
                </Button>
              )}

              {user && (
                <Button
                  variant={currentView === 'team' ? "default" : "ghost"}
                  onClick={handleTeamClick}
                  className={currentView === 'team' ? "font-bold" : ""}
                >
                  Team
                </Button>
              )}

              {/* Project menu button */}
              {user && (
                <Button
                  variant={currentView === 'project' ? "default" : "ghost"}
                  onClick={handleProjectClick}
                  className={currentView === 'project' ? "font-bold" : ""}
                >
                  Project
                </Button>
              )}

              <Button
                variant={currentView === 'blog' ? "default" : "ghost"}
                onClick={handleBlogClick}
                className={currentView === 'blog' ? "font-bold" : ""}
              >
                Blog
              </Button>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : loading ? (
            <div className="flex items-center ml-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              <span className="text-sm text-muted-foreground">Checking login...</span>
            </div>
          ) : (
            <Button
              variant="default"
              onClick={signIn}
              className="ml-2"
            >
              Sign in with Google
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
} 