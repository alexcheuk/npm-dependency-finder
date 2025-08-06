import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Terminal } from "lucide-react";

interface FormData {
  parentPackage: string;
  parentMinVersion: string;
  childPackage: string;
  childMinVersion: string;
  packageRemoved: boolean;
}

export const PackageVersionFinder = () => {
  const [formData, setFormData] = useState<FormData>({
    parentPackage: "",
    parentMinVersion: "",
    childPackage: "",
    childMinVersion: "",
    packageRemoved: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Mock version suggestions - in real app, these would come from npm API
  const mockVersions = ["1.0.0", "1.1.0", "1.2.0", "2.0.0", "2.1.0", "3.0.0"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock search - in real app, this would call npm API
    setTimeout(() => {
      setResult(`Found: ${formData.parentPackage}@${formData.parentMinVersion || "latest"} contains ${formData.childPackage}@${formData.childMinVersion}`);
      setIsLoading(false);
    }, 1500);
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen gradient-subtle py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-accent mb-4">
            <Terminal className="h-8 w-8" />
            <span className="text-2xl font-bold">npm-version-finder</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Find Minimal Package Versions
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover the earliest parent npm package version that satisfies your child package requirements. 
            Resolve vulnerabilities with minimal changelog impact.
          </p>
        </div>

        {/* Main Form */}
        <Card className="terminal-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Package Dependencies
            </CardTitle>
            <CardDescription>
              Enter your package requirements to find the optimal version match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Package */}
              <div className="space-y-2">
                <Label htmlFor="parent-package" className="text-sm font-medium">
                  Parent Package Name
                </Label>
                <Input
                  id="parent-package"
                  placeholder="e.g., react, lodash, express"
                  value={formData.parentPackage}
                  onChange={(e) => updateFormData("parentPackage", e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              {/* Parent Min Version */}
              <div className="space-y-2">
                <Label htmlFor="parent-version" className="text-sm font-medium">
                  Parent Minimum Version
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="parent-version"
                    placeholder="1.0.0"
                    value={formData.parentMinVersion}
                    onChange={(e) => updateFormData("parentMinVersion", e.target.value)}
                    className="font-mono flex-1"
                  />
                  <Select onValueChange={(value) => updateFormData("parentMinVersion", value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVersions.map((version) => (
                        <SelectItem key={version} value={version} className="font-mono">
                          {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Child Package */}
              <div className="space-y-2">
                <Label htmlFor="child-package" className="text-sm font-medium">
                  Child Package Name
                </Label>
                <Input
                  id="child-package"
                  placeholder="e.g., react-dom, uuid, cors"
                  value={formData.childPackage}
                  onChange={(e) => updateFormData("childPackage", e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              {/* Child Version or Removed */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="child-version" className="text-sm font-medium">
                    Child Package Minimum Version
                  </Label>
                  <Input
                    id="child-version"
                    placeholder="1.0.0"
                    value={formData.childMinVersion}
                    onChange={(e) => updateFormData("childMinVersion", e.target.value)}
                    className="font-mono"
                    disabled={formData.packageRemoved}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="package-removed"
                    checked={formData.packageRemoved}
                    onCheckedChange={(checked) => updateFormData("packageRemoved", !!checked)}
                  />
                  <Label
                    htmlFor="package-removed"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    OR if the package is removed
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground glow-accent"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Version
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="terminal-shadow border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Search Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <code>{result}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Built for developers to resolve npm vulnerabilities efficiently</p>
        </div>
      </div>
    </div>
  );
};