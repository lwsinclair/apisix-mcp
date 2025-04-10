import { z } from "zod";

export const createNullablePatchSchema = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  const shape = schema.shape;
  const nullableShape = Object.fromEntries(
    Object.entries(shape).map(([key, value]) => [
        key, 
        value.nullable()
      ])
    );
  return z.object(nullableShape).partial();
};
