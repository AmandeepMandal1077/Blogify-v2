import { z } from "zod";

export const SignupBodySchema = z.object({
  email: z.email(),
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export const SigninBodySchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const createBlogBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const updateBlogBodySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export type SignupBody = z.infer<typeof SignupBodySchema>;
export type SigninBody = z.infer<typeof SigninBodySchema>;
export type CreateBlogBody = z.infer<typeof createBlogBodySchema>;
export type UpdateBlogBody = z.infer<typeof updateBlogBodySchema>;
