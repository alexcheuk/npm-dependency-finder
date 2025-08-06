"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [showForm, setShowForm] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    version?: string;
    message: string;
    details: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResult(data);
      setShowForm(false); // Hide form and show results
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewSearch = () => {
    setShowForm(true);
    setResult(null);
    setError(null);
    // Form data persists automatically since we don't reset it
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
            Discover the earliest parent npm package version that satisfies your
            child package requirements. Resolve vulnerabilities with minimal
            changelog impact.
          </p>
        </div>

        {/* Main Form */}
        {showForm && (
          <Card className="terminal-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Package Dependencies
              </CardTitle>
              <CardDescription>
                Enter your package requirements to find the optimal version
                match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Parent Package */}
                <div className="space-y-2">
                  <Label
                    htmlFor="parent-package"
                    className="text-sm font-medium"
                  >
                    Parent Package Name
                  </Label>
                  <Input
                    id="parent-package"
                    placeholder="e.g., react, lodash, express"
                    value={formData.parentPackage}
                    onChange={(e) =>
                      updateFormData("parentPackage", e.target.value)
                    }
                    className="font-mono"
                    required
                  />
                </div>

                {/* Parent Min Version */}
                <div className="space-y-2">
                  <Label
                    htmlFor="parent-version"
                    className="text-sm font-medium"
                  >
                    Parent Minimum Version
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="parent-version"
                      placeholder="1.0.0"
                      value={formData.parentMinVersion}
                      onChange={(e) =>
                        updateFormData("parentMinVersion", e.target.value)
                      }
                      className="font-mono flex-1"
                    />
                  </div>
                </div>

                {/* Child Package */}
                <div className="space-y-2">
                  <Label
                    htmlFor="child-package"
                    className="text-sm font-medium"
                  >
                    Child Package Name
                  </Label>
                  <Input
                    id="child-package"
                    placeholder="e.g., react-dom, uuid, cors"
                    value={formData.childPackage}
                    onChange={(e) =>
                      updateFormData("childPackage", e.target.value)
                    }
                    className="font-mono"
                    required
                  />
                </div>

                {/* Child Version and/or Removed */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="child-version"
                      className="text-sm font-medium"
                    >
                      Child Package Minimum Version
                    </Label>
                    <Input
                      id="child-version"
                      placeholder="1.0.0"
                      value={formData.childMinVersion}
                      onChange={(e) =>
                        updateFormData("childMinVersion", e.target.value)
                      }
                      className="font-mono"
                      required={!formData.packageRemoved}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="package-removed"
                      checked={formData.packageRemoved}
                      onCheckedChange={(checked) =>
                        updateFormData("packageRemoved", !!checked)
                      }
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="package-removed"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        OR if the package is removed
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        When checked, finds the first version where the child
                        package is either removed OR meets the minimum version
                        above.
                      </p>
                    </div>
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
        )}

        {/* Error */}
        {error && !showForm && (
          <Card className="terminal-shadow border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-red-500">
                <span>Error</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSearch}
                  className="text-sm"
                >
                  Try Again
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Summary */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">
                  Search Parameters:
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Parent Package:</strong>{" "}
                    <code>{formData.parentPackage}</code>{" "}
                    {formData.parentMinVersion &&
                      `>= ${formData.parentMinVersion}`}
                  </div>
                  <div>
                    <strong>Child Package:</strong>{" "}
                    <code>{formData.childPackage}</code>
                  </div>
                  {formData.packageRemoved ? (
                    <div>
                      <strong>Requirement: </strong>
                      {formData.childMinVersion ? (
                        <>
                          Package should be removed <em>OR</em> version {">"}={" "}
                          <code>{formData.childMinVersion}</code>
                        </>
                      ) : (
                        <>Package should be removed</>
                      )}
                    </div>
                  ) : (
                    <div>
                      <strong>Minimum Version:</strong>{" "}
                      <code>{formData.childMinVersion}</code>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 font-mono text-sm text-red-700 dark:text-red-300">
                <code>{error}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !showForm && (
          <Card
            className={`terminal-shadow ${
              result.success ? "border-green-500/20" : "border-yellow-500/20"
            }`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center justify-between ${
                  result.success ? "text-green-500" : "text-yellow-500"
                }`}
              >
                <span>
                  {result.success
                    ? "✅ Compatible Version Found"
                    : "❌ No Compatible Version"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSearch}
                  className="text-sm"
                >
                  New Search
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Summary */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">
                  Search Parameters:
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Parent Package:</strong>{" "}
                    <code>{formData.parentPackage}</code>{" "}
                    {formData.parentMinVersion &&
                      `>= ${formData.parentMinVersion}`}
                  </div>
                  <div>
                    <strong>Child Package:</strong>{" "}
                    <code>{formData.childPackage}</code>
                  </div>
                  {formData.packageRemoved ? (
                    <div>
                      <strong>Requirement: </strong>
                      {formData.childMinVersion ? (
                        <>
                          Package should be removed <em>OR</em> version {">"}={" "}
                          <code>{formData.childMinVersion}</code>
                        </>
                      ) : (
                        <>Package should be removed</>
                      )}
                    </div>
                  ) : (
                    <div>
                      <strong>Minimum Version:</strong>{" "}
                      <code>{formData.childMinVersion}</code>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`${
                  result.success
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-yellow-50 dark:bg-yellow-950"
                } rounded-lg p-4`}
              >
                <div
                  className={`font-mono text-sm ${
                    result.success
                      ? "text-green-700 dark:text-green-300"
                      : "text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  <code>{result.message}</code>
                </div>

                {result.version && (
                  <div className="mt-3 p-3 bg-background rounded border">
                    <strong>Recommended Version:</strong>{" "}
                    <code className="text-accent">
                      {formData.parentPackage}@{result.version}
                    </code>
                  </div>
                )}
              </div>

              {result.details.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Details:</h4>
                  <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                    {result.details.map((detail, index) => (
                      <div
                        key={index}
                        className="font-mono text-xs text-muted-foreground mb-1"
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
