import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MotorsportCategory, VehicleKind } from "@/lib/vehicle-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type AddVehicleFormProps = {
  garageId: Id<"garages">;
};

function convexErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not add vehicle. Please try again.";
}

export function AddVehicleForm({ garageId }: AddVehicleFormProps) {
  const navigate = useNavigate();
  const categoryOptions = useQuery(api.vehicles.getCategoryOptions, {});
  const createVehicle = useMutation(api.vehicles.create);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [vehicleKind, setVehicleKind] = useState<VehicleKind>("car");
  const [motorsportCategory, setMotorsportCategory] = useState<MotorsportCategory>("drag_racing");

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("");
  const [tire, setTire] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [notes, setNotes] = useState("");

  const [dragClass, setDragClass] = useState("");
  const [powerAdder, setPowerAdder] = useState("");
  const [dialInSeconds, setDialInSeconds] = useState("");
  const [dragTransmission, setDragTransmission] = useState("");
  const [tireSize, setTireSize] = useState("");
  const [tireCompound, setTireCompound] = useState("");

  const [nascarSeries, setNascarSeries] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [restrictorPlate, setRestrictorPlate] = useState("");
  const [setupNotes, setSetupNotes] = useState("");

  const [driftClass, setDriftClass] = useState("");
  const [horsepower, setHorsepower] = useState("");
  const [angleKit, setAngleKit] = useState("");
  const [tireCompoundFront, setTireCompoundFront] = useState("");
  const [tireCompoundRear, setTireCompoundRear] = useState("");

  const [disciplineNotes, setDisciplineNotes] = useState("");

  const [hullType, setHullType] = useState("");
  const [marineEngineType, setMarineEngineType] = useState("");
  const [lengthFt, setLengthFt] = useState("");

  function buildMotorsportProfile():
    | { category: "drag_racing"; competitionClass?: string; powerAdder?: "naturally_aspirated" | "turbo" | "supercharged" | "nitrous" | "other"; dialInSeconds?: number; transmission?: string; tireSize?: string; tireCompound?: string }
    | { category: "nascar"; series?: "cup" | "xfinity" | "trucks" | "other"; carNumber?: string; teamName?: string; restrictorPlate?: boolean; setupNotes?: string }
    | { category: "drifting"; competitionClass?: string; horsepower?: number; angleKit?: boolean; tireCompoundFront?: string; tireCompoundRear?: string }
    | { category: "general"; disciplineNotes?: string }
    | undefined {
    if (motorsportCategory === "drag_racing") {
      return {
        category: "drag_racing",
        competitionClass: dragClass.trim() || undefined,
        powerAdder:
          powerAdder === "naturally_aspirated" ||
          powerAdder === "turbo" ||
          powerAdder === "supercharged" ||
          powerAdder === "nitrous" ||
          powerAdder === "other"
            ? powerAdder
            : undefined,
        dialInSeconds: dialInSeconds ? Number(dialInSeconds) : undefined,
        transmission: dragTransmission.trim() || undefined,
        tireSize: tireSize.trim() || undefined,
        tireCompound: tireCompound.trim() || undefined,
      };
    }
    if (motorsportCategory === "nascar") {
      return {
        category: "nascar",
        series:
          nascarSeries === "cup" ||
          nascarSeries === "xfinity" ||
          nascarSeries === "trucks" ||
          nascarSeries === "other"
            ? nascarSeries
            : undefined,
        carNumber: carNumber.trim() || undefined,
        teamName: teamName.trim() || undefined,
        restrictorPlate:
          restrictorPlate === "yes" ? true : restrictorPlate === "no" ? false : undefined,
        setupNotes: setupNotes.trim() || undefined,
      };
    }
    if (motorsportCategory === "drifting") {
      return {
        category: "drifting",
        competitionClass: driftClass.trim() || undefined,
        horsepower: horsepower ? Number(horsepower) : undefined,
        angleKit: angleKit === "yes" ? true : angleKit === "no" ? false : undefined,
        tireCompoundFront: tireCompoundFront.trim() || undefined,
        tireCompoundRear: tireCompoundRear.trim() || undefined,
      };
    }
    return {
      category: "general",
      disciplineNotes: disciplineNotes.trim() || undefined,
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createVehicle({
        garageId,
        name,
        vehicleKind,
        motorsportCategory,
        year: year ? Number(year) : undefined,
        make: make || undefined,
        model: model || undefined,
        vin: vin || undefined,
        engine: engine || undefined,
        transmission: transmission || undefined,
        tire: tire || undefined,
        weightLbs: weightLbs ? Number(weightLbs) : undefined,
        drivetrain: drivetrain || undefined,
        notes: notes || undefined,
        motorsportProfile: buildMotorsportProfile(),
        marineProfile:
          vehicleKind === "boat"
            ? {
                hullType: hullType.trim() || undefined,
                engineType:
                  marineEngineType === "jet" ||
                  marineEngineType === "outboard" ||
                  marineEngineType === "inboard" ||
                  marineEngineType === "other"
                    ? marineEngineType
                    : undefined,
                lengthFt: lengthFt ? Number(lengthFt) : undefined,
              }
            : undefined,
      });
      toast.success("Vehicle added");
      void navigate({ to: "/garages/$garageId", params: { garageId } });
    } catch (e) {
      setError(convexErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (categoryOptions === undefined) {
    return <p className="text-sm text-muted-foreground">Loading form…</p>;
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void handleSubmit(e)}>
      <Card>
        <CardHeader>
          <CardTitle>Vehicle basics</CardTitle>
          <CardDescription>Name, type, and motorsport category determine which fields appear below.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="vehicle-name">Display name</FieldLabel>
              <Input
                id="vehicle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekend bracket car"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="vehicle-kind">Vehicle type</FieldLabel>
              <NativeSelect
                id="vehicle-kind"
                className="w-full"
                value={vehicleKind}
                onChange={(e) => setVehicleKind(e.target.value as VehicleKind)}
              >
                {categoryOptions.vehicleKinds.map((option: { value: VehicleKind; label: string }) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="motorsport-category">Motorsport category</FieldLabel>
              <NativeSelect
                id="motorsport-category"
                className="w-full"
                value={motorsportCategory}
                onChange={(e) => setMotorsportCategory(e.target.value as MotorsportCategory)}
              >
                {categoryOptions.motorsportCategories.map(
                  (option: { value: MotorsportCategory; label: string; description: string }) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                {
                  categoryOptions.motorsportCategories.find(
                    (c: { value: MotorsportCategory }) => c.value === motorsportCategory,
                  )
                    ?.description
                }
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General info</CardTitle>
          <CardDescription>Shared details for any vehicle type.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="year">Year</FieldLabel>
              <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="make">Make</FieldLabel>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="model">Model</FieldLabel>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="vin">VIN / hull ID</FieldLabel>
              <Input id="vin" value={vin} onChange={(e) => setVin(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="engine">Engine</FieldLabel>
              <Input id="engine" value={engine} onChange={(e) => setEngine(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="transmission">Transmission</FieldLabel>
              <Input
                id="transmission"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tire">Tires</FieldLabel>
              <Input id="tire" value={tire} onChange={(e) => setTire(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="weight">Weight (lbs)</FieldLabel>
              <Input
                id="weight"
                type="number"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="drivetrain">Drivetrain</FieldLabel>
              <Input
                id="drivetrain"
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {vehicleKind === "boat" ? (
        <Card>
          <CardHeader>
            <CardTitle>Marine details</CardTitle>
            <CardDescription>Required for boats and watercraft (e.g. jet boat racing).</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="hull-type">Hull type</FieldLabel>
                <Input id="hull-type" value={hullType} onChange={(e) => setHullType(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="marine-engine">Engine type</FieldLabel>
                <NativeSelect
                  id="marine-engine"
                  className="w-full"
                  value={marineEngineType}
                  onChange={(e) => setMarineEngineType(e.target.value)}
                >
                  <NativeSelectOption value="">Select…</NativeSelectOption>
                  <NativeSelectOption value="jet">Jet</NativeSelectOption>
                  <NativeSelectOption value="outboard">Outboard</NativeSelectOption>
                  <NativeSelectOption value="inboard">Inboard</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="length-ft">Length (ft)</FieldLabel>
                <Input
                  id="length-ft"
                  type="number"
                  value={lengthFt}
                  onChange={(e) => setLengthFt(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {motorsportCategory === "drag_racing" ? (
        <Card>
          <CardHeader>
            <CardTitle>Drag racing</CardTitle>
            <CardDescription>Class, power adder, dial-in, and tire setup.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="drag-class">Competition class</FieldLabel>
                <Input
                  id="drag-class"
                  value={dragClass}
                  onChange={(e) => setDragClass(e.target.value)}
                  placeholder="Super Stock, Top Sportsman, etc."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="power-adder">Power adder</FieldLabel>
                <NativeSelect
                  id="power-adder"
                  className="w-full"
                  value={powerAdder}
                  onChange={(e) => setPowerAdder(e.target.value)}
                >
                  <NativeSelectOption value="">Select…</NativeSelectOption>
                  <NativeSelectOption value="naturally_aspirated">Naturally aspirated</NativeSelectOption>
                  <NativeSelectOption value="turbo">Turbo</NativeSelectOption>
                  <NativeSelectOption value="supercharged">Supercharged</NativeSelectOption>
                  <NativeSelectOption value="nitrous">Nitrous</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="dial-in">Dial-in (seconds)</FieldLabel>
                <Input
                  id="dial-in"
                  type="number"
                  step="0.001"
                  value={dialInSeconds}
                  onChange={(e) => setDialInSeconds(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="drag-transmission">Transmission (class setup)</FieldLabel>
                <Input
                  id="drag-transmission"
                  value={dragTransmission}
                  onChange={(e) => setDragTransmission(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tire-size">Tire size</FieldLabel>
                <Input id="tire-size" value={tireSize} onChange={(e) => setTireSize(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="tire-compound">Tire compound</FieldLabel>
                <Input
                  id="tire-compound"
                  value={tireCompound}
                  onChange={(e) => setTireCompound(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {motorsportCategory === "nascar" ? (
        <Card>
          <CardHeader>
            <CardTitle>NASCAR / oval</CardTitle>
            <CardDescription>Series, car number, and setup notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nascar-series">Series</FieldLabel>
                <NativeSelect
                  id="nascar-series"
                  className="w-full"
                  value={nascarSeries}
                  onChange={(e) => setNascarSeries(e.target.value)}
                >
                  <NativeSelectOption value="">Select…</NativeSelectOption>
                  <NativeSelectOption value="cup">Cup</NativeSelectOption>
                  <NativeSelectOption value="xfinity">Xfinity</NativeSelectOption>
                  <NativeSelectOption value="trucks">Trucks</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="car-number">Car number</FieldLabel>
                <Input id="car-number" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                <Input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="restrictor-plate">Restrictor plate</FieldLabel>
                <NativeSelect
                  id="restrictor-plate"
                  className="w-full"
                  value={restrictorPlate}
                  onChange={(e) => setRestrictorPlate(e.target.value)}
                >
                  <NativeSelectOption value="">Unknown</NativeSelectOption>
                  <NativeSelectOption value="yes">Yes</NativeSelectOption>
                  <NativeSelectOption value="no">No</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="setup-notes">Setup notes</FieldLabel>
                <Textarea
                  id="setup-notes"
                  value={setupNotes}
                  onChange={(e) => setSetupNotes(e.target.value)}
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {motorsportCategory === "drifting" ? (
        <Card>
          <CardHeader>
            <CardTitle>Drifting</CardTitle>
            <CardDescription>Competition class, power, and tire compounds.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="drift-class">Competition class</FieldLabel>
                <Input
                  id="drift-class"
                  value={driftClass}
                  onChange={(e) => setDriftClass(e.target.value)}
                  placeholder="Formula Drift Pro, Pro-Am, grassroots"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="horsepower">Horsepower</FieldLabel>
                <Input
                  id="horsepower"
                  type="number"
                  value={horsepower}
                  onChange={(e) => setHorsepower(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="angle-kit">Angle kit</FieldLabel>
                <NativeSelect
                  id="angle-kit"
                  className="w-full"
                  value={angleKit}
                  onChange={(e) => setAngleKit(e.target.value)}
                >
                  <NativeSelectOption value="">Unknown</NativeSelectOption>
                  <NativeSelectOption value="yes">Yes</NativeSelectOption>
                  <NativeSelectOption value="no">No</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="tire-front">Front tire compound</FieldLabel>
                <Input
                  id="tire-front"
                  value={tireCompoundFront}
                  onChange={(e) => setTireCompoundFront(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tire-rear">Rear tire compound</FieldLabel>
                <Input
                  id="tire-rear"
                  value={tireCompoundRear}
                  onChange={(e) => setTireCompoundRear(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {motorsportCategory === "general" ? (
        <Card>
          <CardHeader>
            <CardTitle>Discipline notes</CardTitle>
            <CardDescription>Other motorsports or mixed-use vehicles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="discipline-notes">Notes</FieldLabel>
              <Textarea
                id="discipline-notes"
                value={disciplineNotes}
                onChange={(e) => setDisciplineNotes(e.target.value)}
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add vehicle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => void navigate({ to: "/garages/$garageId", params: { garageId } })}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
