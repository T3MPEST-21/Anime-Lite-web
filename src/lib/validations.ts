import { z } from "zod";

export const profileUpdateSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .optional(),
    full_name: z
        .string()
        .max(50, "Full name must be at most 50 characters")
        .optional()
        .nullable(),
    bio: z
        .string()
        .max(160, "Bio must be at most 160 characters")
        .optional()
        .nullable(),
    image: z
        .string()
        .url("Invalid image URL")
        .optional()
        .nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
