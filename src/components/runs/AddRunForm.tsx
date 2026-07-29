import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ScanLine, Timer } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TrackPicker } from "@/components/runs/TrackPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type AddRunFormProps = {
  garageId: Id<"garages">;
  carId: Id<"cars">;
};

function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddRunForm({ garageId, carId }: AddRunFormProps) {
  const navigate = useNavigate();
  const createRun = useMutation(api.runs.create);

  const [trackId, setTrackId] = useState<Id<"tracks"> | undefined>();
  const [runAt, setRunAt] = useState(toLocalInputValue(Date.now()));
  const [eventName, setEventName] = useState("");
  const [lane, setLane] = useState<"left" | "right" | "">("");
  const [treeType, setTreeType] = useState<"pro" | "sportsman" | "unknown">("sportsman");
  const [enterTimingManually, setEnterTimingManually] = useState(true);
  const [reactionTime, setReactionTime] = useState("");
  const [dialInSeconds, setDialInSeconds] = useState("");
  const [sixtyFt, setSixtyFt] = useState("");
  const [threeThirtyFt, setThreeThirtyFt] = useState("");
  const [oneEighthEt, setOneEighthEt] = useState("");
  const [oneEighthMph, setOneEighthMph] = useState("");
  const [thousandFt, setThousandFt] = useState("");
  const [quarterEt, setQuarterEt] = useState("");
  const [quarterMph, setQuarterMph] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "solo" | "redlight" | "unknown" | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const optionalNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId) {
      setError("Select a track so weather can be attached to this pass");
      return;
    }
    if (enterTimingManually) {
      if (!sixtyFt.trim() || !quarterEt.trim() || !quarterMph.trim()) {
        setError("Manual timing requires 60ft, 1/4 ET, and 1/4 MPH");
        return;
      }
    }
    setPending(true);
    setError(null);
    try {
      const runId = await createRun({
        carId,
        trackId,
        runAt: new Date(runAt).getTime(),
        eventName: eventName || undefined,
        lane: lane || undefined,
        treeType,
        enterTimingManually,
        reactionTime: enterTimingManually ? optionalNumber(reactionTime) : undefined,
        dialInSeconds: enterTimingManually ? optionalNumber(dialInSeconds) : undefined,
        sixtyFt: enterTimingManually ? Number(sixtyFt) : undefined,
        threeThirtyFt: enterTimingManually ? optionalNumber(threeThirtyFt) : undefined,
        oneEighthEt: enterTimingManually ? optionalNumber(oneEighthEt) : undefined,
        oneEighthMph: enterTimingManually ? optionalNumber(oneEighthMph) : undefined,
        thousandFt: enterTimingManually ? optionalNumber(thousandFt) : undefined,
        quarterEt: enterTimingManually ? Number(quarterEt) : undefined,
        quarterMph: enterTimingManually ? Number(quarterMph) : undefined,
        result: result || undefined,
        notes: notes || undefined,
      });

      await navigate({
        to: "/garages/$garageId/vehicles/$vehicleId/runs/$runId",
        params: { garageId, vehicleId: carId, runId },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save run");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Track & session</CardTitle>
          <CardDescription>
            Location drives automatic weather, density altitude, and estimated track temperature.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TrackPicker
            garageId={garageId}
            value={trackId}
            onChange={(id) => {
              setTrackId(id);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="run-at">Run date & time</FieldLabel>
              <Input
                id="run-at"
                type="datetime-local"
                value={runAt}
                onChange={(e) => setRunAt(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-name">Event (optional)</FieldLabel>
              <Input
                id="event-name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Test & Tune"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field>
              <FieldLabel>Lane</FieldLabel>
              <Select value={lane || undefined} onValueChange={(v) => setLane((v as "left" | "right") ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Lane" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Tree</FieldLabel>
              <Select
                value={treeType}
                onValueChange={(v) => setTreeType(v as typeof treeType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sportsman">Sportsman / full tree</SelectItem>
                  <SelectItem value="pro">Pro tree</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Result</FieldLabel>
              <Select
                value={result || undefined}
                onValueChange={(v) => setResult((v as typeof result) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="redlight">Redlight</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Timing</CardTitle>
              <CardDescription>
                Turn this on when you do not have a physical time slip to scan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <Switch
                id="manual-timing"
                checked={enterTimingManually}
                onCheckedChange={setEnterTimingManually}
              />
              <Label htmlFor="manual-timing" className="text-sm font-medium">
                Enter times manually
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {enterTimingManually ? (
            <>
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="size-4 shrink-0" />
                Required: 60ft, 1/4 ET, 1/4 MPH. Increments are optional.
              </p>
              <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="rt">Reaction time</FieldLabel>
                  <Input id="rt" inputMode="decimal" value={reactionTime} onChange={(e) => setReactionTime(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="dial">Dial-in</FieldLabel>
                  <Input id="dial" inputMode="decimal" value={dialInSeconds} onChange={(e) => setDialInSeconds(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sixty">60ft *</FieldLabel>
                  <Input id="sixty" inputMode="decimal" required={enterTimingManually} value={sixtyFt} onChange={(e) => setSixtyFt(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="330">330ft</FieldLabel>
                  <Input id="330" inputMode="decimal" value={threeThirtyFt} onChange={(e) => setThreeThirtyFt(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="eighth-et">1/8 ET</FieldLabel>
                  <Input id="eighth-et" inputMode="decimal" value={oneEighthEt} onChange={(e) => setOneEighthEt(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="eighth-mph">1/8 MPH</FieldLabel>
                  <Input id="eighth-mph" inputMode="decimal" value={oneEighthMph} onChange={(e) => setOneEighthMph(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="thousand">1000ft</FieldLabel>
                  <Input id="thousand" inputMode="decimal" value={thousandFt} onChange={(e) => setThousandFt(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="qet">1/4 ET *</FieldLabel>
                  <Input id="qet" inputMode="decimal" required={enterTimingManually} value={quarterEt} onChange={(e) => setQuarterEt(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="qmph">1/4 MPH *</FieldLabel>
                  <Input id="qmph" inputMode="decimal" required={enterTimingManually} value={quarterMph} onChange={(e) => setQuarterMph(e.target.value)} />
                  <FieldDescription>Trap speed</FieldDescription>
                </Field>
              </FieldGroup>
            </>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ScanLine className="size-4" />
                Timing will come from a time-slip scan
              </p>
              <p className="mt-2">
                Save the run with track and session details, then upload a slip photo on the run page to
                fill 60ft, 1/8, 1000ft, and trap times after review.
              </p>
            </div>
          )}
          <Field className="mt-4">
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save run"}
        </Button>
        <p className="self-center text-xs text-muted-foreground">
          Weather + DA auto-fill after save. If that fails, enter weather manually on the run page.
        </p>
      </div>
    </form>
  );
}
