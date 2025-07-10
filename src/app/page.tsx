import Link from 'next/link';
import { ChefHat, LogIn } from 'lucide-react';
import { FridgeChefClient } from '@/components/fridge-chef-client';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ChefHat className="text-primary h-8 w-8" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              FridgeChef AI
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <FridgeChefClient />
      </main>
      <footer className="p-4 border-t mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Powered by Generative AI. Recipes are suggestions and should be prepared with care.</p>
          <p>&copy; {new Date().getFullYear()} FridgeChef AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
