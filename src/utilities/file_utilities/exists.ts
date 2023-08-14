import { access } from 'fs/promises';

export async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch (err) {
    return false;
  }
}
