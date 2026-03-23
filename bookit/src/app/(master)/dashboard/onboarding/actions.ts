'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateAfterOnboarding() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/onboarding');
}
