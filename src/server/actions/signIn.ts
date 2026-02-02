"use server";

import { authenticate } from "../auth";

export default async function signIn(): Promise<never> {
  authenticate();
}
