import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectConfig {
  businessType: string;
  websiteName: string;
  description: string;
  preferredColors: string;
  images: File[];
}

interface ProjectConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (config: ProjectConfig) => void;
}

export function ProjectConfigDialog({ open, onOpenChange, onSubmit }: ProjectConfigDialogProps) {
  const [config, setConfig] = useState<ProjectConfig>({
    businessType: "",
    websiteName: "",
    description: "",
    preferredColors: "",
    images: []
  });
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only image files are allowed",
        variant: "destructive"
      });
    }
    
    setConfig(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
  };

  const removeImage = (index: number) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!config.businessType || !config.websiteName || !config.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select value={config.businessType} onValueChange={(value) => setConfig(prev => ({ ...prev, businessType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="nonprofit">Non-profit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteName">Website Name *</Label>
            <Input
              id="websiteName"
              value={config.websiteName}
              onChange={(e) => setConfig(prev => ({ ...prev, websiteName: e.target.value }))}
              placeholder="Enter website name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your website and its purpose..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredColors">Preferred Colors</Label>
            <Input
              id="preferredColors"
              value={config.preferredColors}
              onChange={(e) => setConfig(prev => ({ ...prev, preferredColors: e.target.value }))}
              placeholder="e.g., blue, modern, dark theme, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Reference Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload reference images
                </p>
              </label>
            </div>
            
            {config.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {config.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}