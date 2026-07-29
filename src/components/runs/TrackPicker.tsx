import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { MapPin, Plus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TrackPickerProps = {
  garageId: Id<"garages">;
  value?: Id<"tracks">;
  onChange: (trackId: Id<"tracks">, label: string) => void;
};

export function TrackPicker({ garageId, value, onChange }: TrackPickerProps) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const ensureCatalog = useMutation(api.tracks.ensureCatalogSeeded);
  const createTrack = useMutation(api.tracks.create);
  const tracks = useQuery(api.tracks.search, { query, garageId });

  useEffect(() => {
    void ensureCatalog({});
  }, [ensureCatalog]);

  const selected = tracks?.find((t) => t._id === value);

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="track-search">Track</FieldLabel>
        <Input
          id="track-search"
          placeholder="Search tracks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>

      <div className="max-h-48 overflow-y-auto rounded-md border">
        {(tracks ?? []).length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            No tracks found. Add a custom track with coordinates.
          </p>
        ) : (
          <ul className="divide-y">
            {(tracks ?? []).map((track) => {
              const active = track._id === value;
              const location = [track.city, track.state].filter(Boolean).join(", ");
              return (
                <li key={track._id}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                      active ? "bg-muted" : ""
                    }`}
                    onClick={() => onChange(track._id, track.name)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">{track.name}</span>
                      {location ? (
                        <span className="block text-xs text-muted-foreground">{location}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? (
        <p className="text-xs text-muted-foreground">
          Selected: {selected.name}
          {selected.elevationFt !== undefined ? ` · ${selected.elevationFt} ft elev` : ""}
        </p>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="size-4" />
            Add track
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CreateTrackForm
            garageId={garageId}
            onCreated={(id, name) => {
              onChange(id, name);
              setCreateOpen(false);
            }}
            createTrack={createTrack}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateTrackForm({
  garageId,
  onCreated,
  createTrack,
}: {
  garageId: Id<"garages">;
  onCreated: (id: Id<"tracks">, name: string) => void;
  createTrack: (args: {
    garageId: Id<"garages">;
    name: string;
    city?: string;
    state?: string;
    latitude: number;
    longitude: number;
    surface: "concrete" | "asphalt" | "other";
  }) => Promise<Id<"tracks">>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [surface, setSurface] = useState<"concrete" | "asphalt" | "other">("asphalt");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => setError("Could not read current location"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const id = await createTrack({
        garageId,
        name,
        city: city || undefined,
        state: state || undefined,
        latitude: lat,
        longitude: lng,
        surface,
      });
      onCreated(id, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create track");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Add a track</DialogTitle>
        <DialogDescription>
          Paste coordinates from Google Maps. Elevation is resolved automatically for weather.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="track-name">Name</FieldLabel>
          <Input id="track-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="track-city">City</FieldLabel>
            <Input id="track-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="track-state">State</FieldLabel>
            <Input id="track-state" value={state} onChange={(e) => setState(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="track-lat">Latitude</FieldLabel>
            <Input
              id="track-lat"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              inputMode="decimal"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="track-lng">Longitude</FieldLabel>
            <Input
              id="track-lng"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              inputMode="decimal"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel>Surface</FieldLabel>
          <Select value={surface} onValueChange={(v) => setSurface(v as typeof surface)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concrete">Concrete</SelectItem>
              <SelectItem value="asphalt">Asphalt</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={useMyLocation}>
          Use my location
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save track"}
        </Button>
      </DialogFooter>
    </form>
  );
}
