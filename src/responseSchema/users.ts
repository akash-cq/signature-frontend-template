import Zod from "zod";

export const officerSchema = Zod.object({
    id: Zod.string(),
    name: Zod.string(),
});
