import * as db from "../db";
import { INITIAL_FAQ_SEEDS } from "./constants";
export async function seedInitialFaqs() { return db.ensureInitialFaqs(INITIAL_FAQ_SEEDS); }

