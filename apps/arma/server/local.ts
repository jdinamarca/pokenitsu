// Photos for local use only (fotos-solo-local): off unless ARMA_FOTOS_LOCALES=1, kept in their own folder,
// never in IMAGE_DIR (the shared storage the current app uploads) and never in git
import { resolve } from 'node:path';

export const localPhotosOn = () => process.env.ARMA_FOTOS_LOCALES === '1';
export const LOCAL_IMAGE_DIR = resolve(process.env.LOCAL_IMAGE_DIR || new URL('../../../data/imagenes-locales', import.meta.url).pathname);
