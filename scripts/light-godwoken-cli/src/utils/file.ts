import { constants } from 'fs';
import { resolve, relative } from 'path';
import { access, mkdir, writeFile } from 'fs/promises';

export function absolutePath(path: string) {
  return resolve(process.cwd(), path);
}

export async function writeJson<T extends object>(pathWithFilename: string, json: T) {
  const relativePath = relative(process.cwd(), pathWithFilename);
  const withFilename = relativePath.split('/');

  if (withFilename.length > 1) {
    const withoutFilename = withFilename.slice(0, withFilename.length - 1);
    await createPathIfNotExist(withoutFilename.join('/'));
  }

  await writeFile(pathWithFilename, JSON.stringify(json, null, 2));
  return pathWithFilename;
}

export async function createPathIfNotExist(path: string) {
  const list = path.split('/');
  const startI = path.startsWith('../') ? 2 : 1;

  let notExists = false;
  for (let i = startI; i <= list.length; i++) {
    const currentPath = list.slice(0, i).join('/');
    if (notExists) {
      await mkdir(currentPath);
      continue;
    }

    try {
      await access(currentPath, constants.R_OK);
    } catch {
      if (!notExists) notExists = true;
      await mkdir(currentPath);
    }
  }
}
