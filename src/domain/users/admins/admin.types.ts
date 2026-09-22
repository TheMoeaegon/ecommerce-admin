import { z } from 'zod';

import type { retriveProfileResponseSchema } from './admin.schema.ts';

export type RetriveProfileResponse = z.infer<typeof retriveProfileResponseSchema>;
