import { z } from 'zod';

const identifyRequestSchema = z.object({
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().nullable().optional()
}).refine(
  data => data.email || data.phoneNumber,
  { message: 'Either email or phoneNumber must be provided' }
);

export function validateIdentifyRequest(data: any) {
  return identifyRequestSchema.safeParse(data);
}