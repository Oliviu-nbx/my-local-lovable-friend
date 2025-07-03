import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2, ExternalLink } from "lucide-react";

interface CloneWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromptGenerated: (prompt: string, url: string) => void;
}

export function CloneWebsiteDialog({ open, onOpenChange, onPromptGenerated }: CloneWebsiteDialogProps) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const { toast } = useToast();

  const analyzeWebsite = async () => {
    if (!url.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a website URL",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const apiKey = localStorage.getItem('gemini-api-key') || 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Fetch website content
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const content = data.contents;

      const prompt = `Analyze this website HTML and create a detailed prompt for recreating a similar website design and functionality:

Website URL: ${url}
HTML Content: ${content.substring(0, 10000)}...

Please provide a comprehensive prompt that includes:
1. Overall design style and layout
2. Color scheme and typography
3. Navigation structure
4. Main sections and content areas
5. Interactive elements
6. Responsive design considerations
7. Any special features or animations

Format the response as a ready-to-use prompt for creating a similar website.`;

      const result = await model.generateContent(prompt);
      const generatedPrompt = result.response.text();
      
      setAnalysisResult(generatedPrompt);
      toast({
        title: "Analysis complete",
        description: "Website analyzed successfully"
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze website. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUsePrompt = () => {
    if (analysisResult) {
      onPromptGenerated(analysisResult, url);
      onOpenChange(false);
      setUrl("");
      setAnalysisResult("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clone Website</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
              />
              <Button 
                onClick={analyzeWebsite} 
                disabled={isAnalyzing}
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          {analysisResult && (
            <div className="space-y-2">
              <Label>Generated Prompt</Label>
              <Textarea
                value={analysisResult}
                onChange={(e) => setAnalysisResult(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Analysis results will appear here..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {analysisResult && (
              <Button onClick={handleUsePrompt}>
                Use This Prompt
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}