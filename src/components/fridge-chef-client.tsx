'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { handleIdentifyIngredients, handleGenerateRecipes } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, AlertCircle, Salad, UtensilsCrossed, Sparkles, ChefHat, Save, Download, Share2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';

type Recipe = {
  name: string;
  ingredients: string;
  instructions: string;
};

const initialState = {
  ingredients: undefined,
  error: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
          Scanning...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Scan Ingredients
        </>
      )}
    </Button>
  );
}

export function FridgeChefClient() {
  const [state, formAction] = useFormState(handleIdentifyIngredients, initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    formRef.current?.reset();
    setImagePreview(null);
    setRecipes([]);
    setRecipeError(null);
    // Reset form state by re-triggering formAction with empty form data
    const formData = new FormData();
    formAction(formData);
  };

  const handleSave = () => {
     if (!isLoggedIn) return; // This will be handled by the Link redirect anyway
    toast({
      title: 'Ingredients Saved!',
      description: 'Your ingredients have been saved to your profile.',
    });
  };

  const handleDownload = () => {
     if (!isLoggedIn) return;
    if (state?.ingredients) {
      const text = state.ingredients.join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ingredients.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Download Started',
        description: 'Your ingredients.txt file is downloading.',
      });
    }
  };

  const handleShare = async () => {
     if (!isLoggedIn) return;
    if (navigator.share && state?.ingredients) {
      try {
        await navigator.share({
          title: 'My Fridge Ingredients',
          text: `Check out the ingredients I have: ${state.ingredients.join(', ')}`,
        });
        toast({ title: 'Shared successfully!' });
      } catch (error) {
        toast({
          title: 'Share failed',
          description: 'Could not share the ingredients.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Web Share API not supported',
        description: 'Your browser does not support the native share function.',
        variant: 'destructive',
      });
    }
  };
  
  const generateQrCodeUrl = () => {
    if (state?.ingredients) {
      const text = `Ingredients: ${state.ingredients.join(', ')}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    }
    return '';
  };


  useEffect(() => {
    if (state?.ingredients && state.ingredients.length > 0) {
      const generate = async () => {
        setIsGeneratingRecipes(true);
        setRecipeError(null);
        setRecipes([]);
        const result = await handleGenerateRecipes(state.ingredients!);
        if (result.recipes) {
          setRecipes(result.recipes);
        } else {
          setRecipeError(result.error || 'Failed to generate recipes.');
        }
        setIsGeneratingRecipes(false);
      };
      generate();
    }
  }, [state?.ingredients]);

  const { pending: formPending } = useFormStatus();
  
  const AuthTooltipWrapper = ({ children, featureName }: { children: React.ReactNode, featureName: string }) => {
    if (isLoggedIn) {
      return <>{children}</>;
    }
    return (
       <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/login">{children}</Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Log in to {featureName}.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  };


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold font-headline">What&apos;s in your fridge?</h2>
        <p className="text-muted-foreground">
          Upload a photo, and our AI will suggest delicious recipes with the ingredients you already have!
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload Fridge Photo
          </CardTitle>
          <CardDescription>
            For best results, use a clear photo of your fridge&apos;s contents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              required
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file:text-foreground"
            />
            {imagePreview && (
              <div className="mt-4 relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-dashed">
                <Image src={imagePreview} alt="Fridge content preview" fill objectFit="contain" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
               <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
               <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
      
      {state?.error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Identifying Ingredients</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
         </Alert>
      )}

      {(formPending || state?.ingredients) && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Salad className="h-6 w-6"/>
                    Identified Ingredients
                </CardTitle>
                 {!isLoggedIn && !formPending && state.ingredients && (
                    <CardDescription>
                        <Link href="/login" className="text-primary underline">Log in</Link> or <Link href="/signup" className="text-primary underline">Sign up</Link> to save, download, or share your ingredients.
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                 {formPending ? (
                     <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-32 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                     </div>
                 ) : state.ingredients && state.ingredients.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {state.ingredients.map((ingredient) => (
                            <Badge key={ingredient} variant="secondary" className="text-lg py-1 px-3">
                                {ingredient}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </CardContent>
            {state.ingredients && state.ingredients.length > 0 && !formPending && (
              <CardFooter className="flex-wrap gap-2 pt-4 border-t">
                  <AuthTooltipWrapper featureName="save your ingredients">
                    <Button onClick={handleSave} variant="outline" size="sm" disabled={!isLoggedIn}>
                        <Save className="mr-2 h-4 w-4"/> Save
                    </Button>
                  </AuthTooltipWrapper>
                  <AuthTooltipWrapper featureName="download your ingredients list">
                    <Button onClick={handleDownload} variant="outline" size="sm" disabled={!isLoggedIn}>
                        <Download className="mr-2 h-4 w-4"/> Download
                    </Button>
                  </AuthTooltipWrapper>
                  <AuthTooltipWrapper featureName="share your ingredients">
                    <Button onClick={handleShare} variant="outline" size="sm" disabled={!isLoggedIn}>
                        <Share2 className="mr-2 h-4 w-4"/> Share
                    </Button>
                  </AuthTooltipWrapper>
                   <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm">
                               <QrCode className="mr-2 h-4 w-4"/> Show QR Code
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xs">
                           <DialogHeader>
                               <DialogTitle>Share with QR Code</DialogTitle>
                           </DialogHeader>
                            {generateQrCodeUrl() ? (
                                <div className="flex items-center justify-center p-4">
                                    <Image src={generateQrCodeUrl()} alt="QR code for ingredients" width={200} height={200} />
                                </div>
                            ) : (
                               <p className="p-4 text-center text-muted-foreground">No ingredients to share.</p> 
                            )}
                        </DialogContent>
                   </Dialog>
              </CardFooter>
            )}
        </Card>
      )}

      {(isGeneratingRecipes || recipes.length > 0 || recipeError) && (
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-6 w-6"/>
                    Recipe Suggestions
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {isGeneratingRecipes ? (
                     <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                     </div>
                 ) : recipeError ? (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Generating Recipes</AlertTitle>
                        <AlertDescription>{recipeError}</AlertDescription>
                     </Alert>
                 ) : recipes.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                       {recipes.map((recipe, index) => (
                          <AccordionItem key={recipe.name} value={`item-${index}`}>
                             <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <ChefHat className="h-5 w-5 text-primary"/>
                                    {recipe.name}
                                </div>
                             </AccordionTrigger>
                             <AccordionContent className="prose prose-sm max-w-none text-foreground">
                                
                                <h4 className="font-bold mt-2 mb-1">Ingredients:</h4>
                                <p>{recipe.ingredients}</p>
                                
                                <h4 className="font-bold mt-4 mb-1">Instructions:</h4>
                                <div className="space-y-2">
                                {recipe.instructions.split('\n').map((line, i) => line.trim() && <p key={`${recipe.name}-instruction-${i}`}>{line}</p>)}
                                </div>
                             </AccordionContent>
                          </AccordionItem>
                       ))}
                    </Accordion>
                 )}
            </CardContent>
         </Card>
      )}
    </div>
  );
}
