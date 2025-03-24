"use client";

import React from 'react';
import Header from '../../components/Header';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Page() {
  return (
    <div>
      <Header currentView="project" />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Create and manage your projects. Track progress, collaborate with your team, and organize your work.
        </p>

        <Card className="border p-8 text-center">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>Get started by creating your first project</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 