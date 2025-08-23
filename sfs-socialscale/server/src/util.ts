import { randomUUID } from 'node:crypto';
export const uuid = () => randomUUID();
export const ok = <T>(data: T) => ({ ok: true, data });
export const err = (message: string, code = 400) => ({ ok: false, error: { message, code } });
export const requireKey = (key?: string, header?: string) => key && header && key === header;