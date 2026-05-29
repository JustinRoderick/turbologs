import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Mail, Plus, Send, ShieldCheck, UserPlus, X } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { VehicleCardData } from "@/components/vehicles/VehicleCard";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/garages/$garageId/")({
  component: GaragePage,
});

function GaragePage() {
  const { garageId } = Route.useParams();
  const garageIdTyped = garageId as Id<"garages">;

  const garage = useQuery(api.vehicles.getGarageSummary, { garageId: garageIdTyped });
  const preview = useQuery(
    api.garageAccessRequests.getGarageAccessPreview,
    garage === null ? { garageId: garageIdTyped } : "skip",
  );
  const vehicles = useQuery(
    api.vehicles.listByGarage,
    garage ? { garageId: garageIdTyped } : "skip",
  );

  if (garage === undefined || (garage === null && preview === undefined) || (garage && vehicles === undefined)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading garage…</p>
      </div>
    );
  }

  if (garage === null || preview === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        {preview ? (
          <GarageAccessRequestCard preview={preview} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Garage not found</CardTitle>
              <CardDescription>You may not have access to this garage.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const canAddVehicle = garage.role !== "viewer";
  const canManageAccess = garage.role === "owner" || garage.role === "admin";
  const vehicleRows = vehicles ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{garage.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            Your role: {garage.role}
            {garage.slug ? ` · ${garage.slug}` : ""}
          </p>
        </div>
        {canAddVehicle ? (
          <Button asChild>
            <Link to="/garages/$garageId/vehicles/new" params={{ garageId }}>
              <Plus className="size-4" />
              Add vehicle
            </Link>
          </Button>
        ) : null}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Vehicles</h2>
        {vehicleRows.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No vehicles yet</CardTitle>
              <CardDescription>
                Add your first vehicle to start logging runs, tunes, and setup data for this garage.
              </CardDescription>
            </CardHeader>
            {canAddVehicle ? (
              <div className="px-6 pb-6">
                <Button asChild>
                  <Link to="/garages/$garageId/vehicles/new" params={{ garageId }}>
                    <Plus className="size-4" />
                    Add vehicle
                  </Link>
                </Button>
              </div>
            ) : null}
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {vehicleRows.map((vehicle: VehicleCardData) => (
              <li key={vehicle._id}>
                <VehicleCard vehicle={vehicle} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManageAccess ? (
        <GarageAccessPanel garageId={garageIdTyped} vehicles={vehicleRows} />
      ) : null}

      <Button variant="link" className="w-fit px-0" asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

type AccessRole = "admin" | "tuner" | "worker" | "viewer";
type CarScope = "all_cars" | "selected_cars";

type GarageAccessPreview = {
  _id: Id<"garages">;
  name: string;
  slug?: string;
  location?: string;
  alreadyMember: boolean;
  pendingRequest: boolean;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function GarageAccessRequestCard({ preview }: { preview: GarageAccessPreview }) {
  const requestAccess = useMutation(api.garageAccessRequests.requestGarageAccess);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      await requestAccess({
        garageId: preview._id,
        message: message.trim() || undefined,
        carScope: "all_cars",
      });
      setMessage("");
      setResult("Request sent. The garage owner can approve or deny it from this garage page.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-red-400" />
          Request access to {preview.name}
        </CardTitle>
        <CardDescription>
          {preview.location ? `${preview.location}. ` : ""}
          Ask the garage owner for worker access so you can view and update vehicle data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {preview.pendingRequest ? (
          <div className="rounded-none border border-border/60 bg-muted/30 p-3 text-sm">
            Your access request is pending owner review.
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleRequestAccess(event)}>
            <Field>
              <FieldLabel htmlFor="access-message">Message to owner</FieldLabel>
              <Textarea
                id="access-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Let them know who you are and why you need garage access."
                rows={4}
              />
            </Field>
            {result ? <p className="text-sm text-emerald-400">{result}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-fit" disabled={submitting} type="submit">
              <Send className="size-4" />
              {submitting ? "Sending…" : "Request access"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function GarageAccessPanel({
  garageId,
  vehicles,
}: {
  garageId: Id<"garages">;
  vehicles: Array<VehicleCardData>;
}) {
  const members = useQuery(api.garageMembers.listForGarage, { garageId });
  const pendingInvites = useQuery(api.garageInvites.listPendingForGarage, { garageId });
  const pendingRequests = useQuery(api.garageAccessRequests.listPendingForGarage, { garageId });
  const createInvite = useMutation(api.garageInvites.createGarageInvite);
  const approveRequest = useMutation(api.garageAccessRequests.approveAccessRequest);
  const denyRequest = useMutation(api.garageAccessRequests.denyAccessRequest);

  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<AccessRole>("worker");
  const [carScope, setCarScope] = useState<CarScope>("all_cars");
  const [selectedCarIds, setSelectedCarIds] = useState<Array<Id<"cars">>>([]);
  const [submittingInvites, setSubmittingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<Id<"garageAccessRequests"> | null>(
    null,
  );

  const loading = members === undefined || pendingInvites === undefined || pendingRequests === undefined;
  const memberRows = members ?? [];
  const pendingInviteRows = pendingInvites ?? [];
  const pendingRequestRows = pendingRequests ?? [];

  function toggleSelectedVehicle(vehicleId: Id<"cars">, checked: boolean) {
    setSelectedCarIds((current) =>
      checked ? [...new Set([...current, vehicleId])] : current.filter((id) => id !== vehicleId),
    );
  }

  async function handleCreateInvites(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingInvites(true);
    setInviteError(null);
    setInviteResult(null);

    const parsedEmails = [
      ...new Set(
        emails
          .split(/[\n,]+/)
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (parsedEmails.length === 0) {
      setInviteError("Add at least one email address.");
      setSubmittingInvites(false);
      return;
    }

    if (carScope === "selected_cars" && selectedCarIds.length === 0) {
      setInviteError("Select at least one vehicle or choose all vehicles.");
      setSubmittingInvites(false);
      return;
    }

    const failures: Array<string> = [];
    for (const email of parsedEmails) {
      try {
        await createInvite({
          garageId,
          email,
          role,
          carScope,
          selectedCarIds: carScope === "selected_cars" ? selectedCarIds : undefined,
        });
      } catch (err) {
        failures.push(`${email}: ${getErrorMessage(err)}`);
      }
    }

    setSubmittingInvites(false);
    if (failures.length > 0) {
      setInviteError(failures.join(" "));
      setInviteResult(
        failures.length === parsedEmails.length
          ? null
          : `Sent ${parsedEmails.length - failures.length} invite(s).`,
      );
      return;
    }

    setEmails("");
    setInviteResult(`Sent ${parsedEmails.length} invite(s).`);
  }

  async function handleReviewRequest(
    requestId: Id<"garageAccessRequests">,
    action: "approve" | "deny",
  ) {
    setReviewingRequestId(requestId);
    try {
      if (action === "approve") {
        await approveRequest({ requestId });
      } else {
        await denyRequest({ requestId });
      }
    } finally {
      setReviewingRequestId(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Garage access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite workers by email, review access requests, and keep vehicle access scoped.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-red-400" />
              Invite workers
            </CardTitle>
            <CardDescription>Paste one email per line. Each email receives its own invite token.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(event) => void handleCreateInvites(event)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="invite-emails">Email line</FieldLabel>
                  <Textarea
                    id="invite-emails"
                    value={emails}
                    onChange={(event) => setEmails(event.target.value)}
                    placeholder={"alex@example.com\nsam@example.com"}
                    rows={4}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select value={role} onValueChange={(value) => setRole(value as AccessRole)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="tuner">Tuner</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Vehicle scope</FieldLabel>
                    <Select value={carScope} onValueChange={(value) => setCarScope(value as CarScope)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_cars">All vehicles</SelectItem>
                        <SelectItem value="selected_cars">Selected vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {carScope === "selected_cars" ? (
                  <Field>
                    <FieldLabel>Selected vehicles</FieldLabel>
                    <div className="grid gap-2 rounded-none border border-border/60 p-3">
                      {vehicles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Add a vehicle before creating selected-vehicle invites.
                        </p>
                      ) : (
                        vehicles.map((vehicle) => (
                          <label key={vehicle._id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedCarIds.includes(vehicle._id)}
                              onCheckedChange={(checked) =>
                                toggleSelectedVehicle(vehicle._id, checked === true)
                              }
                            />
                            {vehicle.name}
                          </label>
                        ))
                      )}
                    </div>
                    <FieldDescription>
                      Selected access uses vehicle assignments after the invite is accepted.
                    </FieldDescription>
                  </Field>
                ) : null}
              </FieldGroup>
              {inviteResult ? <p className="text-sm text-emerald-400">{inviteResult}</p> : null}
              {inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}
              <Button className="w-fit" disabled={submittingInvites} type="submit">
                <Mail className="size-4" />
                {submittingInvites ? "Sending…" : "Send invites"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-red-400" />
              Pending requests
            </CardTitle>
            <CardDescription>Approve workers that requested access from the garage page.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading access controls…</p>
            ) : pendingRequestRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending access requests.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pendingRequestRows.map((request) => (
                  <li key={request._id} className="rounded-none border border-border/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{request.requesterEmail}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {request.requestedRole} · {request.carScope.replace("_", " ")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={reviewingRequestId === request._id}
                          onClick={() => void handleReviewRequest(request._id, "approve")}
                        >
                          <Check className="size-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingRequestId === request._id}
                          onClick={() => void handleReviewRequest(request._id, "deny")}
                        >
                          <X className="size-3" />
                          Deny
                        </Button>
                      </div>
                    </div>
                    {request.message ? (
                      <p className="mt-2 text-sm text-muted-foreground">{request.message}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active members</CardTitle>
            <CardDescription>People who currently have garage access.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading members…</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {memberRows.map((member) => (
                  <li
                    key={member._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-border/60 px-3 py-2"
                  >
                    <span>{member.email ?? member.memberAuthUserId}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={member.status === "active" ? "secondary" : "outline"}>
                        {member.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                      {!member.allCars ? <Badge variant="outline">Selected vehicles</Badge> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>Invites that have not been accepted yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading invites…</p>
            ) : pendingInviteRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {pendingInviteRows.map((invite) => (
                  <li
                    key={invite._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-border/60 px-3 py-2"
                  >
                    <span>{invite.email ?? "Invite link"}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {invite.role}
                      </Badge>
                      <Badge variant="outline">{invite.carScope.replace("_", " ")}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
