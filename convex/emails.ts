import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { env } from "./env";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

const fromEmail = process.env.RESEND_FROM_EMAIL ?? "TurboLogs <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function appUrl(path: string): string {
  return new URL(path, env.SITE_URL).toString();
}

export const sendGarageInviteEmail = internalMutation({
  args: {
    inviteId: v.id("garageInvites"),
    to: v.string(),
    garageName: v.string(),
    inviterEmail: v.optional(v.string()),
    token: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const inviteLink = appUrl(
      `/onboarding?${new URLSearchParams({
        intent: "join",
        step: "invite",
        token: args.token,
      }).toString()}`,
    );
    const inviterLine = args.inviterEmail
      ? `<p>${escapeHtml(args.inviterEmail)} invited you to join this garage.</p>`
      : "";

    const emailId = await resend.sendEmail(ctx, {
      from: fromEmail,
      to: args.to,
      subject: `Join ${args.garageName} on TurboLogs`,
      html: `
        <h1>You're invited to ${escapeHtml(args.garageName)}</h1>
        ${inviterLine}
        <p>Accept the invite to view and update vehicle data in TurboLogs.</p>
        <p><a href="${inviteLink}">Accept invite</a></p>
        <p>If the button does not work, paste this link into your browser:</p>
        <p>${inviteLink}</p>
      `,
      text: `You're invited to ${args.garageName} on TurboLogs. Accept the invite: ${inviteLink}`,
    });

    await ctx.db.patch("garageInvites", args.inviteId, { emailId });
    return emailId;
  },
});

export const sendGarageAccessRequestEmail = internalMutation({
  args: {
    requestId: v.id("garageAccessRequests"),
    to: v.string(),
    garageName: v.string(),
    requesterEmail: v.string(),
    message: v.optional(v.string()),
    garageId: v.id("garages"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const reviewLink = appUrl(`/garages/${args.garageId}`);
    const messageHtml = args.message
      ? `<p><strong>Message:</strong> ${escapeHtml(args.message)}</p>`
      : "";

    const emailId = await resend.sendEmail(ctx, {
      from: fromEmail,
      to: args.to,
      subject: `${args.requesterEmail} requested access to ${args.garageName}`,
      html: `
        <h1>Garage access request</h1>
        <p>${escapeHtml(args.requesterEmail)} requested worker access to ${escapeHtml(args.garageName)}.</p>
        ${messageHtml}
        <p><a href="${reviewLink}">Review the request</a></p>
      `,
      text: `${args.requesterEmail} requested worker access to ${args.garageName}. Review it here: ${reviewLink}`,
    });

    await ctx.db.patch("garageAccessRequests", args.requestId, { emailId });
    return emailId;
  },
});

export const sendGarageAccessDecisionEmail = internalMutation({
  args: {
    to: v.string(),
    garageName: v.string(),
    garageId: v.id("garages"),
    approved: v.boolean(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const garageLink = appUrl(`/garages/${args.garageId}`);
    const subject = args.approved
      ? `Your ${args.garageName} access was approved`
      : `Your ${args.garageName} access request was denied`;
    const body = args.approved
      ? `You can now open ${args.garageName} and work with its vehicle data.`
      : `The garage owner denied your access request for ${args.garageName}.`;

    return await resend.sendEmail(ctx, {
      from: fromEmail,
      to: args.to,
      subject,
      html: `
        <h1>${escapeHtml(subject)}</h1>
        <p>${escapeHtml(body)}</p>
        ${args.approved ? `<p><a href="${garageLink}">Open garage</a></p>` : ""}
      `,
      text: args.approved ? `${body} Open the garage: ${garageLink}` : body,
    });
  },
});
