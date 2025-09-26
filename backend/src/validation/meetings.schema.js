import { z } from "zod";

export const CreateMeetingSchema = z.object({
    eventId: z.string().min(1).optional(),
    inviteeId: z.string().min(1),
    startAt: z.coerce.date(), // accepts ISO string, coerces to Date
    endAt: z.coerce.date(),
    location: z.enum(["in-person", "online"]).default("in-person").optional(),
    place: z.string().max(200).optional(),
    message: z.string().max(500).optional(),
});

export const UpdateStatusSchema = z.object({
    status: z.enum(["accepted", "declined", "cancelled"]),
    note: z.string().max(300).optional(),
});
