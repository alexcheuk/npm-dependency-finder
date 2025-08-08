"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { analytics } from "@/lib/analytics";

interface FormData {
  parentPackage: string;
  parentMinVersion: string;
  childPackage: string;
  childMinVersion: string;
  packageRemoved: boolean;
}

const STORAGE_KEY = "npm-dependency-finder-form-data";

// Utility functions for localStorage
const saveToLocalStorage = (data: FormData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save form data to localStorage:", error);
  }
};

const loadFromLocalStorage = (): FormData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Failed to load form data from localStorage:", error);
  }
  return null;
};

// URL parameter utility functions
const loadFromURLParams = (searchParams: URLSearchParams): FormData | null => {
  const parentPackage = searchParams.get("parent");
  const parentMinVersion = searchParams.get("parentVersion") || "";
  const childPackage = searchParams.get("child");
  const childMinVersion = searchParams.get("childVersion") || "";
  const packageRemoved = searchParams.get("removed") === "true";

  if (parentPackage && childPackage) {
    return {
      parentPackage,
      parentMinVersion,
      childPackage,
      childMinVersion,
      packageRemoved,
    };
  }
  return null;
};

const createPermalink = (formData: FormData): string => {
  const params = new URLSearchParams();
  params.set("parent", formData.parentPackage);
  if (formData.parentMinVersion) {
    params.set("parentVersion", formData.parentMinVersion);
  }
  params.set("child", formData.childPackage);
  if (formData.childMinVersion) {
    params.set("childVersion", formData.childMinVersion);
  }
  if (formData.packageRemoved) {
    params.set("removed", "true");
  }
  return `?${params.toString()}`;
};

export const PackageVersionFinder = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  type RequirementType = "min" | "minOrRemoved" | "removed";
  const [requirementType, setRequirementType] =
    useState<RequirementType>("min");

  // Load form data with priority: URL params > localStorage > default
  useEffect(() => {
    // First try to load from URL parameters (highest priority)
    const urlData = loadFromURLParams(searchParams);
    if (urlData) {
      setFormData(urlData);
      // derive requirement type from fields
      if (urlData.packageRemoved && !urlData.childMinVersion) {
        setRequirementType("removed");
      } else if (urlData.packageRemoved && urlData.childMinVersion) {
        setRequirementType("minOrRemoved");
      } else {
        setRequirementType("min");
      }
      return;
    }

    // Fallback to localStorage
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setFormData(savedData);
      if (savedData.packageRemoved && !savedData.childMinVersion) {
        setRequirementType("removed");
      } else if (savedData.packageRemoved && savedData.childMinVersion) {
        setRequirementType("minOrRemoved");
      } else {
        setRequirementType("min");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Track search analytics
    analytics.trackSearch(formData.parentPackage, formData.childPackage);

    // Save form data to localStorage before submitting
    saveToLocalStorage(formData);

    // Update URL with form data (create permalink)
    const permalink = createPermalink(formData);
    router.push(permalink, { scroll: false });

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

      // Track successful result analytics
      if (data.recommendation) {
        analytics.trackResult(
          formData.parentPackage,
          formData.childPackage,
          data.recommendation
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      // Track error analytics
      analytics.trackError("search_failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Keep formData fields in sync when requirement type changes
  const handleRequirementChange = (value: RequirementType) => {
    setRequirementType(value);
    if (value === "min") {
      setFormData((prev) => ({ ...prev, packageRemoved: false }));
    } else if (value === "minOrRemoved") {
      setFormData((prev) => ({ ...prev, packageRemoved: true }));
    } else if (value === "removed") {
      setFormData((prev) => ({
        ...prev,
        packageRemoved: true,
        childMinVersion: "",
      }));
    }
  };

  const handleNewSearch = () => {
    analytics.trackFormInteraction("new_search", "button");
    setShowForm(true);
    setResult(null);
    setError(null);
    // Form data persists automatically since we don't reset it
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Terminal className="h-8 w-8" aria-hidden="true" />
            <span className="text-2xl font-bold font-mono">
              npm-version-finder
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            Find Minimal Package Versions
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto font-mono text-sm">
            Discover the earliest parent npm package version that satisfies your
            child package requirements. Resolve vulnerabilities with minimal
            changelog impact.
          </p>
        </header>

        {/* Main Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono">
                <Package className="h-5 w-5 text-primary" />
                Package Dependencies
              </CardTitle>
              <CardDescription className="font-mono text-sm">
                Enter your package requirements to find the optimal version
                match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                role="search"
                aria-label="npm package dependency search"
              >
                {/* Parent Package */}
                <div className="space-y-2">
                  <Label
                    htmlFor="parent-package"
                    className="text-sm font-medium font-mono"
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
                    className="text-sm font-medium font-mono"
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
                    className="text-sm font-medium font-mono"
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

                {/* Requirement Mode */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium font-mono">
                      Requirement
                    </Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label
                        className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                          requirementType === "min"
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="requirement"
                          value="min"
                          checked={requirementType === "min"}
                          onChange={() => handleRequirementChange("min")}
                          className="accent-primary"
                        />
                        <span className="text-sm font-mono">Min version</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                          requirementType === "minOrRemoved"
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="requirement"
                          value="minOrRemoved"
                          checked={requirementType === "minOrRemoved"}
                          onChange={() =>
                            handleRequirementChange("minOrRemoved")
                          }
                          className="accent-primary"
                        />
                        <span className="text-sm font-mono">
                          Min version OR removed
                        </span>
                      </label>
                      <label
                        className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                          requirementType === "removed"
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="requirement"
                          value="removed"
                          checked={requirementType === "removed"}
                          onChange={() => handleRequirementChange("removed")}
                          className="accent-primary"
                        />
                        <span className="text-sm font-mono">Removed</span>
                      </label>
                    </div>
                  </div>

                  {/* Child Version (enabled for min and minOrRemoved) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="child-version"
                      className="text-sm font-medium font-mono"
                    >
                      Child Package Minimum Version
                    </Label>
                    <Input
                      id="child-version"
                      placeholder={
                        requirementType === "removed"
                          ? "Not required for 'Removed'"
                          : "1.0.0"
                      }
                      value={formData.childMinVersion}
                      onChange={(e) =>
                        updateFormData("childMinVersion", e.target.value)
                      }
                      className="font-mono"
                      required={requirementType !== "removed"}
                      disabled={requirementType === "removed"}
                    />
                    {requirementType === "minOrRemoved" && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Will match if the package is removed OR meets this
                        minimum version.
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full font-mono"
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
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-destructive font-mono">
                <span>Error</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSearch}
                  className="text-sm font-mono"
                >
                  Try Again
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Summary */}
              <div className="bg-muted rounded-sm p-4">
                <h4 className="font-semibold text-sm mb-2 font-mono">
                  Search Parameters:
                </h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <strong>Parent Package:</strong>{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded-sm">
                      {formData.parentPackage}
                    </code>{" "}
                    {formData.parentMinVersion &&
                      `>= ${formData.parentMinVersion}`}
                  </div>
                  <div>
                    <strong>Child Package:</strong>{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded-sm">
                      {formData.childPackage}
                    </code>
                  </div>
                  {formData.packageRemoved ? (
                    <div>
                      <strong>Requirement: </strong>
                      {formData.childMinVersion ? (
                        <>
                          Package should be removed <em>OR</em> version {">"}={" "}
                          <code className="bg-secondary px-1 py-0.5 rounded-sm">
                            {formData.childMinVersion}
                          </code>
                        </>
                      ) : (
                        <>Package should be removed</>
                      )}
                    </div>
                  ) : (
                    <div>
                      <strong>Minimum Version:</strong>{" "}
                      <code className="bg-secondary px-1 py-0.5 rounded-sm">
                        {formData.childMinVersion}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-4 font-mono text-sm text-destructive">
                <code>{error}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !showForm && (
          <Card
            className={
              result.success ? "border-accent/20" : "border-destructive/20"
            }
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center justify-between font-mono ${
                  result.success ? "text-accent" : "text-destructive"
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
                  className="text-sm font-mono"
                >
                  New Search
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Summary */}
              <div className="bg-muted rounded-sm p-4">
                <h4 className="font-semibold text-sm mb-2 font-mono">
                  Search Parameters:
                </h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <strong>Parent Package:</strong>{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded-sm">
                      {formData.parentPackage}
                    </code>{" "}
                    {formData.parentMinVersion &&
                      `>= ${formData.parentMinVersion}`}
                  </div>
                  <div>
                    <strong>Child Package:</strong>{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded-sm">
                      {formData.childPackage}
                    </code>
                  </div>
                  {formData.packageRemoved ? (
                    <div>
                      <strong>Requirement: </strong>
                      {formData.childMinVersion ? (
                        <>
                          Package should be removed <em>OR</em> version {">"}={" "}
                          <code className="bg-secondary px-1 py-0.5 rounded-sm">
                            {formData.childMinVersion}
                          </code>
                        </>
                      ) : (
                        <>Package should be removed</>
                      )}
                    </div>
                  ) : (
                    <div>
                      <strong>Minimum Version:</strong>{" "}
                      <code className="bg-secondary px-1 py-0.5 rounded-sm">
                        {formData.childMinVersion}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`${
                  result.success
                    ? "bg-accent/10 border border-accent/20"
                    : "bg-destructive/10 border border-destructive/20"
                } rounded-sm p-4`}
              >
                <div
                  className={`font-mono text-sm ${
                    result.success ? "text-accent" : "text-destructive"
                  }`}
                >
                  <code>{result.message}</code>
                </div>

                {result.version && (
                  <div className="mt-3 p-3 bg-card border rounded-sm">
                    <strong className="font-mono">Recommended Version:</strong>{" "}
                    <code className="bg-primary text-primary-foreground px-1 py-0.5 rounded-sm font-mono">
                      {formData.parentPackage}@{result.version}
                    </code>
                  </div>
                )}
              </div>

              {result.details.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm font-mono">Details:</h4>
                  <div className="bg-muted rounded-sm p-3 max-h-64 overflow-y-auto">
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
        <footer className="text-center text-sm text-muted-foreground font-mono">
          <p>Built for developers to resolve npm vulnerabilities efficiently</p>
        </footer>
      </div>
    </main>
  );
};
