import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  garages: defineTable({
    ownerAuthUserId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_auth_user_id", ["ownerAuthUserId"])
    .index("by_slug", ["slug"])
    .index("by_is_archived", ["isArchived"]),

  garageMembers: defineTable({
    garageId: v.id("garages"),
    memberAuthUserId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("tuner"),
      v.literal("worker"),
      v.literal("viewer"),
    ),
    status: v.union(v.literal("active"), v.literal("revoked")),
    allCars: v.boolean(),
    invitedByAuthUserId: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_garage_id", ["garageId"])
    .index("by_member_auth_user_id", ["memberAuthUserId"])
    .index("by_garage_id_and_member_auth_user_id", ["garageId", "memberAuthUserId"])
    .index("by_garage_id_and_role", ["garageId", "role"])
    .index("by_member_auth_user_id_and_status", ["memberAuthUserId", "status"]),

  garageInvites: defineTable({
    garageId: v.id("garages"),
    email: v.optional(v.string()),
    inviteToken: v.string(),
    role: v.union(v.literal("admin"), v.literal("tuner"), v.literal("worker"), v.literal("viewer")),
    carScope: v.union(v.literal("all_cars"), v.literal("selected_cars")),
    selectedCarIds: v.optional(v.array(v.id("cars"))),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
      v.literal("expired"),
    ),
    invitedByAuthUserId: v.string(),
    expiresAt: v.number(),
    acceptedByAuthUserId: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
    emailId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invite_token", ["inviteToken"])
    .index("by_garage_id_and_status", ["garageId", "status"])
    .index("by_email_and_status", ["email", "status"])
    .index("by_garage_id_and_email_and_status", ["garageId", "email", "status"]),

  garageAccessRequests: defineTable({
    garageId: v.id("garages"),
    requesterAuthUserId: v.string(),
    requesterEmail: v.string(),
    message: v.optional(v.string()),
    requestedRole: v.union(
      v.literal("admin"),
      v.literal("tuner"),
      v.literal("worker"),
      v.literal("viewer"),
    ),
    carScope: v.union(v.literal("all_cars"), v.literal("selected_cars")),
    selectedCarIds: v.optional(v.array(v.id("cars"))),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("cancelled"),
    ),
    reviewedByAuthUserId: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    emailId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_garage_id_and_status", ["garageId", "status"])
    .index("by_requester_auth_user_id_and_status", ["requesterAuthUserId", "status"])
    .index("by_garage_id_and_requester_auth_user_id", ["garageId", "requesterAuthUserId"]),

  cars: defineTable({
    garageId: v.id("garages"),
    name: v.string(),
    vehicleKind: v.optional(
      v.union(
        v.literal("car"),
        v.literal("truck"),
        v.literal("motorcycle"),
        v.literal("boat"),
        v.literal("other"),
      ),
    ),
    motorsportCategory: v.optional(
      v.union(
        v.literal("drag_racing"),
        v.literal("nascar"),
        v.literal("drifting"),
        v.literal("general"),
      ),
    ),
    motorsportProfile: v.optional(
      v.union(
        v.object({
          category: v.literal("drag_racing"),
          competitionClass: v.optional(v.string()),
          powerAdder: v.optional(
            v.union(
              v.literal("naturally_aspirated"),
              v.literal("turbo"),
              v.literal("supercharged"),
              v.literal("nitrous"),
              v.literal("other"),
            ),
          ),
          dialInSeconds: v.optional(v.number()),
          transmission: v.optional(v.string()),
          tireSize: v.optional(v.string()),
          tireCompound: v.optional(v.string()),
        }),
        v.object({
          category: v.literal("nascar"),
          series: v.optional(
            v.union(v.literal("cup"), v.literal("xfinity"), v.literal("trucks"), v.literal("other")),
          ),
          carNumber: v.optional(v.string()),
          teamName: v.optional(v.string()),
          restrictorPlate: v.optional(v.boolean()),
          setupNotes: v.optional(v.string()),
        }),
        v.object({
          category: v.literal("drifting"),
          competitionClass: v.optional(v.string()),
          horsepower: v.optional(v.number()),
          angleKit: v.optional(v.boolean()),
          tireCompoundFront: v.optional(v.string()),
          tireCompoundRear: v.optional(v.string()),
        }),
        v.object({
          category: v.literal("general"),
          disciplineNotes: v.optional(v.string()),
        }),
      ),
    ),
    marineProfile: v.optional(
      v.object({
        hullType: v.optional(v.string()),
        engineType: v.optional(
          v.union(v.literal("jet"), v.literal("outboard"), v.literal("inboard"), v.literal("other")),
        ),
        lengthFt: v.optional(v.number()),
      }),
    ),
    year: v.optional(v.number()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    vin: v.optional(v.string()),
    engine: v.optional(v.string()),
    transmission: v.optional(v.string()),
    tire: v.optional(v.string()),
    weightLbs: v.optional(v.number()),
    drivetrain: v.optional(v.string()),
    notes: v.optional(v.string()),
    totalPasses: v.number(),
    runHours: v.optional(v.number()),
    isActive: v.boolean(),
    archivedAt: v.optional(v.number()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_garage_id", ["garageId"])
    .index("by_garage_id_and_is_active", ["garageId", "isActive"])
    .index("by_garage_id_and_name", ["garageId", "name"]),

  carAssignments: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    memberAuthUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("tuner"), v.literal("worker"), v.literal("viewer")),
    status: v.union(v.literal("active"), v.literal("revoked")),
    assignedByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_car_id", ["carId"])
    .index("by_member_auth_user_id", ["memberAuthUserId"])
    .index("by_car_id_and_member_auth_user_id", ["carId", "memberAuthUserId"])
    .index("by_garage_id_and_member_auth_user_id", ["garageId", "memberAuthUserId"]),

  weatherSnapshots: defineTable({
    garageId: v.id("garages"),
    carId: v.optional(v.id("cars")),
    source: v.union(v.literal("manual"), v.literal("api")),
    observedAt: v.number(),
    temperatureF: v.number(),
    humidityPct: v.number(),
    barometricPressureInHg: v.number(),
    densityAltitudeFt: v.number(),
    windMph: v.optional(v.number()),
    windDirectionDeg: v.optional(v.number()),
    trackTempF: v.optional(v.number()),
    createdByAuthUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_garage_id_and_observed_at", ["garageId", "observedAt"])
    .index("by_car_id_and_observed_at", ["carId", "observedAt"]),

  runs: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    driverAuthUserId: v.optional(v.string()),
    runAt: v.number(),
    trackName: v.optional(v.string()),
    eventName: v.optional(v.string()),
    lane: v.optional(v.union(v.literal("left"), v.literal("right"))),
    sixtyFt: v.number(),
    threeThirtyFt: v.optional(v.number()),
    oneEighthEt: v.optional(v.number()),
    oneEighthMph: v.optional(v.number()),
    thousandFt: v.optional(v.number()),
    quarterEt: v.number(),
    quarterMph: v.number(),
    weatherSnapshotId: v.optional(v.id("weatherSnapshots")),
    activeTuneFileId: v.optional(v.id("tuneFiles")),
    notes: v.optional(v.string()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_car_id_and_run_at", ["carId", "runAt"])
    .index("by_garage_id_and_run_at", ["garageId", "runAt"])
    .index("by_weather_snapshot_id", ["weatherSnapshotId"]),

  maintenanceLogs: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    performedAt: v.number(),
    category: v.union(
      v.literal("oil_change"),
      v.literal("service"),
      v.literal("repair"),
      v.literal("inspection"),
      v.literal("engine_refresh"),
      v.literal("engine_rebuild"),
      v.literal("other"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    odometerMiles: v.optional(v.number()),
    enginePassCount: v.optional(v.number()),
    engineHours: v.optional(v.number()),
    nextDueAt: v.optional(v.number()),
    nextDuePassCount: v.optional(v.number()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_car_id_and_performed_at", ["carId", "performedAt"])
    .index("by_garage_id_and_performed_at", ["garageId", "performedAt"])
    .index("by_car_id_and_category", ["carId", "category"]),

  suspensionSetupLogs: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    loggedAt: v.number(),
    frontShockCompression: v.optional(v.string()),
    frontShockRebound: v.optional(v.string()),
    rearShockCompression: v.optional(v.string()),
    rearShockRebound: v.optional(v.string()),
    tirePressureFrontPsi: v.optional(v.number()),
    tirePressureRearPsi: v.optional(v.number()),
    launchRpm: v.optional(v.number()),
    boostPsi: v.optional(v.number()),
    ballastLbs: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_car_id_and_logged_at", ["carId", "loggedAt"])
    .index("by_garage_id_and_logged_at", ["garageId", "loggedAt"]),

  datalogFiles: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    runId: v.optional(v.id("runs")),
    uploadedByAuthUserId: v.string(),
    storageProvider: v.union(v.literal("convex_storage"), v.literal("s3")),
    storageId: v.optional(v.id("_storage")),
    s3Key: v.optional(v.string()),
    s3Bucket: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    fileSizeBytes: v.number(),
    checksumSha256: v.optional(v.string()),
    visibility: v.union(
      v.literal("garage"),
      v.literal("assigned_members"),
      v.literal("owner_only"),
    ),
    parseStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    parsedAt: v.optional(v.number()),
    metadata: v.optional(v.record(v.string(), v.string())),
    uploadedAt: v.number(),
    replacedByFileId: v.optional(v.id("datalogFiles")),
    deletedAt: v.optional(v.number()),
  })
    .index("by_car_id_and_uploaded_at", ["carId", "uploadedAt"])
    .index("by_run_id", ["runId"])
    .index("by_parse_status", ["parseStatus"])
    .index("by_storage_id", ["storageId"])
    .index("by_s3_key", ["s3Key"]),

  tuneFiles: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    relatedRunId: v.optional(v.id("runs")),
    uploadedByAuthUserId: v.string(),
    storageProvider: v.union(v.literal("convex_storage"), v.literal("s3")),
    storageId: v.optional(v.id("_storage")),
    s3Key: v.optional(v.string()),
    s3Bucket: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    fileSizeBytes: v.number(),
    tuneVersion: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    requiresOwnerApproval: v.boolean(),
    approvedByAuthUserId: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    uploadedAt: v.number(),
    supersedesTuneFileId: v.optional(v.id("tuneFiles")),
    deletedAt: v.optional(v.number()),
  })
    .index("by_car_id_and_uploaded_at", ["carId", "uploadedAt"])
    .index("by_car_id_and_tune_version", ["carId", "tuneVersion"])
    .index("by_car_id_and_status", ["carId", "status"])
    .index("by_storage_id", ["storageId"])
    .index("by_s3_key", ["s3Key"]),

  parsedDatalogMetrics: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    datalogFileId: v.id("datalogFiles"),
    runId: v.optional(v.id("runs")),
    parserName: v.string(),
    parserVersion: v.string(),
    parseConfidence: v.optional(v.number()),
    numericMetrics: v.record(v.string(), v.number()),
    textMetrics: v.optional(v.record(v.string(), v.string())),
    extractedAt: v.number(),
  })
    .index("by_datalog_file_id", ["datalogFileId"])
    .index("by_run_id", ["runId"])
    .index("by_car_id_and_extracted_at", ["carId", "extractedAt"]),

  timeSlipExtractions: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    runId: v.optional(v.id("runs")),
    sourceStorageId: v.optional(v.id("_storage")),
    sourceS3Key: v.optional(v.string()),
    extractionStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("needs_review"),
    ),
    confidence: v.optional(v.number()),
    sixtyFt: v.optional(v.number()),
    threeThirtyFt: v.optional(v.number()),
    oneEighthEt: v.optional(v.number()),
    oneEighthMph: v.optional(v.number()),
    thousandFt: v.optional(v.number()),
    quarterEt: v.optional(v.number()),
    quarterMph: v.optional(v.number()),
    ocrRawText: v.optional(v.string()),
    extractedAt: v.optional(v.number()),
    reviewedByAuthUserId: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdByAuthUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_car_id_and_created_at", ["carId", "createdAt"])
    .index("by_run_id", ["runId"])
    .index("by_extraction_status", ["extractionStatus"]),

  predictions: defineTable({
    garageId: v.id("garages"),
    carId: v.id("cars"),
    generatedForRunId: v.optional(v.id("runs")),
    inputWeatherSnapshotId: v.optional(v.id("weatherSnapshots")),
    modelName: v.string(),
    modelVersion: v.string(),
    predictedQuarterEt: v.optional(v.number()),
    predictedQuarterMph: v.optional(v.number()),
    predictedOneEighthEt: v.optional(v.number()),
    predictedOneEighthMph: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    explanation: v.optional(v.string()),
    factorWeights: v.optional(v.record(v.string(), v.number())),
    createdByAuthUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_car_id_and_created_at", ["carId", "createdAt"])
    .index("by_generated_for_run_id", ["generatedForRunId"]),

  userOnboarding: defineTable({
    authUserId: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped"),
    ),
    currentStepId: v.union(
      v.literal("welcome"),
      v.literal("choose_path"),
      v.literal("create_garage"),
      v.literal("invite"),
      v.literal("first_car"),
      v.literal("done"),
    ),
    pathChoice: v.optional(v.union(v.literal("create"), v.literal("invite"), v.literal("browse"))),
    draftGarage: v.optional(
      v.object({
        name: v.string(),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
      }),
    ),
    draftInviteToken: v.optional(v.string()),
    onboardingVersion: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    skippedAt: v.optional(v.number()),
  }).index("by_auth_user_id", ["authUserId"]),

  auditEvents: defineTable({
    garageId: v.optional(v.id("garages")),
    actorAuthUserId: v.optional(v.string()),
    actorRole: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("tuner"),
        v.literal("worker"),
        v.literal("viewer"),
      ),
    ),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.record(v.string(), v.string())),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_garage_id_and_created_at", ["garageId", "createdAt"])
    .index("by_actor_auth_user_id_and_created_at", ["actorAuthUserId", "createdAt"])
    .index("by_entity_type_and_entity_id", ["entityType", "entityId"]),
});
