import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileUp, ScanLine } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ECU_BRAND_OPTIONS, formatBytes } from "@/lib/run-format";
import type { EcuBrand } from "@/lib/run-format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  carId: Id<"cars">;
  runId: Id<"runs">;
};

export function RunAttachmentsPanel({ carId, runId }: Props) {
  const files = useQuery(api.datalogFiles.listByRun, { runId });
  const generateUploadUrl = useMutation(api.datalogFiles.generateUploadUrl);
  const attachToRun = useMutation(api.datalogFiles.attachToRun);
  const generateSlipUrl = useMutation(api.timeSlipExtractions.generateUploadUrl);
  const createSlip = useMutation(api.timeSlipExtractions.createFromUpload);
  const applySlip = useMutation(api.timeSlipExtractions.applyToRun);

  const [ecuBrand, setEcuBrand] = useState<EcuBrand>("fueltech");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractionId, setExtractionId] = useState<Id<"timeSlipExtractions"> | null>(null);

  const extraction = useQuery(
    api.timeSlipExtractions.get,
    extractionId ? { extractionId } : "skip",
  );

  const onDatalogSelected = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateUploadUrl({ carId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      await attachToRun({
        carId,
        runId,
        storageId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        ecuBrand,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Datalog upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSlipSelected = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateSlipUrl({ carId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!result.ok) {
        throw new Error("Time-slip upload failed");
      }
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      const id = await createSlip({ carId, runId, storageId });
      setExtractionId(id);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Time-slip upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onApplyExtraction = async () => {
    if (!extraction || extraction.sixtyFt === undefined || extraction.quarterEt === undefined || extraction.quarterMph === undefined) {
      setUploadError("OCR needs 60ft, 1/4 ET, and 1/4 MPH before applying");
      return;
    }
    await applySlip({
      extractionId: extraction._id,
      runId,
      reactionTime: extraction.reactionTime,
      dialInSeconds: extraction.dialInSeconds,
      lane: extraction.lane,
      sixtyFt: extraction.sixtyFt,
      threeThirtyFt: extraction.threeThirtyFt,
      oneEighthEt: extraction.oneEighthEt,
      oneEighthMph: extraction.oneEighthMph,
      thousandFt: extraction.thousandFt,
      quarterEt: extraction.quarterEt,
      quarterMph: extraction.quarterMph,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datalog</CardTitle>
          <CardDescription>
            Store FuelTech, Holley, or Haltech logs for this pass. Raw download/view for MVP — proprietary parsers come later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <FieldGroup>
            <Field>
              <FieldLabel>ECU</FieldLabel>
              <Select value={ecuBrand} onValueChange={(v) => setEcuBrand(v as EcuBrand)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ECU_BRAND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="datalog-file">Upload file</FieldLabel>
              <Input
                id="datalog-file"
                type="file"
                disabled={uploading}
                onChange={(e) => void onDatalogSelected(e.target.files?.[0] ?? null)}
              />
            </Field>
          </FieldGroup>
          <ul className="space-y-2 text-sm">
            {(files ?? []).map((file) => (
              <li key={file._id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.ecuBrand ?? "ecu"} · {formatBytes(file.fileSizeBytes)}
                  </p>
                </div>
                {file.url ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={file.url} target="_blank" rel="noreferrer">
                      <FileUp className="size-4" />
                      View
                    </a>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time slip scan</CardTitle>
          <CardDescription>
            Upload a photo. Review OCR fields before applying them to this run.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="slip-file">Time slip image</FieldLabel>
            <Input
              id="slip-file"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => void onSlipSelected(e.target.files?.[0] ?? null)}
            />
          </Field>

          {extraction ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="mb-2 flex items-center gap-2 font-medium capitalize">
                <ScanLine className="size-4" />
                Status: {extraction.extractionStatus.replaceAll("_", " ")}
              </p>
              {extraction.errorMessage ? (
                <p className="text-destructive">{extraction.errorMessage}</p>
              ) : null}
              {extraction.imageUrl ? (
                <img
                  src={extraction.imageUrl}
                  alt="Uploaded time slip"
                  className="mb-3 max-h-48 rounded-md border object-contain"
                />
              ) : null}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">60ft</dt>
                  <dd>{extraction.sixtyFt ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">1/4 ET</dt>
                  <dd>{extraction.quarterEt ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">1/4 MPH</dt>
                  <dd>{extraction.quarterMph ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">RT</dt>
                  <dd>{extraction.reactionTime ?? "—"}</dd>
                </div>
              </dl>
              {(extraction.extractionStatus === "needs_review" ||
                extraction.extractionStatus === "completed") && (
                <Button className="mt-3" size="sm" onClick={() => void onApplyExtraction()}>
                  Apply to run
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {uploadError ? <p className="text-sm text-destructive lg:col-span-2">{uploadError}</p> : null}
    </div>
  );
}
