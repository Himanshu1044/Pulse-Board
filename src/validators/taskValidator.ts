import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  status: z
    .enum(["todo", "in_progress", "review", "done"])
    .optional(),
  priority: z
    .enum(["low", "medium", "high"])
    .optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z
    .enum(["todo", "in_progress", "review", "done"])
    .optional(),
  priority: z
    .enum(["low", "medium", "high"])
    .optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required"
  }
);