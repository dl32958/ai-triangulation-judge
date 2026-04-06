import { useState } from "react";
import { Download, Image as ImageIcon, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { adaptBackendRunResponse } from "./adapters";
import { runPipelineFromPath, runPipelineUpload } from "./api";
import { ExplainDebugDrawer } from "./components/ExplainDebugDrawer";
import { FieldDrawer } from "./components/FieldDrawer";
import { HistorySidebar } from "./components/HistorySidebar";
import { ModernFieldCard } from "./components/ModernFieldCard";
import { RunControls } from "./components/RunControls";
import { UploadSection } from "./components/UploadSection";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { dark, light } from "./tokens";
import type { FieldResult, PipelineStep, RunResult } from "./types";

const DEFAULT_FIELDS = ["company", "date", "address", "total", "phone number"];

export default function App() {
  const { resolvedTheme } = useTheme();
  const tokens = resolvedTheme === "dark" ? dark : light;
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldResult | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "path">("upload");
  const [imagePath, setImagePath] = useState("../data/dev/X00016469612.jpg");
  const [category, setCategory] = useState("receipt");
  const [fields, setFields] = useState<string[]>(DEFAULT_FIELDS);

  const handleRun = async () => {
    setIsRunning(true);
    setCurrentStep(1);

    try {
      const response =
        inputMode === "upload"
          ? await runPipelineUpload({
              file: uploadedFile as File,
              docCategory: category,
              fieldsText: fields.join(","),
              debug: debugMode,
            })
          : await runPipelineFromPath({
              imagePath,
              docCategory: category,
              fields,
              debug: debugMode,
            });

      setCurrentStep(5);
      const adapted = adaptBackendRunResponse(response);
      setResult(adapted);
      setHistory((prev) => [adapted, ...prev].slice(0, 20));
      toast.success("Analysis completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  const handleSelectHistory = (historyResult: RunResult) => {
    setResult(historyResult);
  };

  const handleDeleteHistory = (index: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
    toast.success("History item deleted");
  };

  const handleNewChat = () => {
    setResult(null);
    setUploadedImage(null);
    setUploadedFile(null);
    setInputMode("upload");
    setImagePath("../data/dev/X00016469612.jpg");
    setCategory("receipt");
    setFields(DEFAULT_FIELDS);
  };

  const downloadFinalResult = () => {
    if (!result) return;
    const json = JSON.stringify(result.raw_result, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "final_result.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded final_result.json");
  };

  const canRun = category && (inputMode === "path" ? imagePath : uploadedFile);

  const sortedFields = result
    ? [...result.fields].sort((a, b) => {
        const priority = { fail: 0, review_needed: 1, pass: 2 };
        return priority[a.field_state] - priority[b.field_state];
      })
    : [];

  const getOverallStatus = () => {
    if (!result) return null;
    const hasFailure = result.fields.some((field) => field.field_state === "fail");
    const hasReview = result.fields.some((field) => field.field_state === "review_needed");

    if (hasFailure) return { label: "Failed Fields", variant: "destructive" as const };
    if (hasReview) return { label: "Needs Review", variant: "secondary" as const };
    return { label: "All Passed", variant: "default" as const };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <HistorySidebar
        history={history}
        currentResult={result}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewChat={handleNewChat}
        tokens={tokens}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Document Analyzer</h1>
                <p className="text-sm text-gray-500">Intelligent field extraction</p>
              </div>
            </div>
            {result && overallStatus ? (
              <div className="flex items-center gap-3">
                <Badge variant={overallStatus.variant} className="text-sm h-7 px-3">
                  {overallStatus.label}
                </Badge>
                <span className="text-sm text-gray-500">{result.metadata.elapsed_seconds.toFixed(1)}s</span>
                <Button onClick={downloadFinalResult} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[420px] flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-1">Input</h2>
                  <p className="text-sm text-gray-500">Upload and configure</p>
                </div>

                <UploadSection
                  uploadedImage={uploadedImage}
                  onImageUpload={(image, file) => {
                    setUploadedImage(image);
                    setUploadedFile(file);
                  }}
                  onImageRemove={() => {
                    setUploadedImage(null);
                    setUploadedFile(null);
                  }}
                  category={category}
                  onCategoryChange={setCategory}
                  fields={fields}
                  onFieldsChange={setFields}
                  inputMode={inputMode}
                  onInputModeChange={setInputMode}
                  imagePath={imagePath}
                  onImagePathChange={setImagePath}
                />
              </div>
            </div>

            <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-800">
              <RunControls
                onRun={handleRun}
                isRunning={isRunning}
                currentStep={currentStep}
                debugMode={debugMode}
                onDebugModeChange={setDebugMode}
                canRun={!!canRun}
                tokens={tokens}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto">
              {!result ? (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to analyze</h3>
                    <p className="text-gray-500">Upload a document and click "Run Analysis" to extract fields</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Results</h2>
                        <p className="text-sm text-gray-500">
                          {result.fields.length} fields • {result.metadata.doc_category}
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleNewChat} size="sm">
                        New Analysis
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <SummaryCard label="Passed" value={result.fields.filter((field) => field.field_state === "pass").length} tone="green" />
                      <SummaryCard
                        label="Review"
                        value={result.fields.filter((field) => field.field_state === "review_needed").length}
                        tone="yellow"
                      />
                      <SummaryCard label="Failed" value={result.fields.filter((field) => field.field_state === "fail").length} tone="red" />
                    </div>
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                      {sortedFields.map((field) => (
                      <ModernFieldCard key={field.field_name} field={field} onClick={() => setSelectedField(field)} tokens={tokens} />
                    ))}
                  </div>

                  <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Annotated Image</h2>
                        <p className="text-sm text-gray-500">Preview of the final field localization output</p>
                      </div>
                      {result.metadata.annotated_image_url ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={result.metadata.annotated_image_url} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Open Image
                          </a>
                        </Button>
                      ) : null}
                    </div>

                    {result.metadata.annotated_image_url ? (
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900">
                          <img
                            src={result.metadata.annotated_image_url}
                            alt="Annotated result"
                            className="w-full h-auto object-contain"
                          />
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Artifact path:</span>
                          <p className="mt-1 break-all">{result.metadata.annotated_image || "N/A"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
                        <ImageIcon className="mb-3 h-8 w-8 text-gray-400" />
                        <p>No annotated image available for this run.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {result ? (
              <div className="flex-shrink-0">
                <ExplainDebugDrawer result={result} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <FieldDrawer field={selectedField} open={!!selectedField} onClose={() => setSelectedField(null)} />
      <Toaster />
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "green" | "yellow" | "red" }) {
  const toneStyles = {
    green: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className={`text-center p-4 rounded-lg ${toneStyles[tone]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 font-medium">{label}</div>
    </div>
  );
}
