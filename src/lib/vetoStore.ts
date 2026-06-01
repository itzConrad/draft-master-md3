import { Redis } from "@upstash/redis";
import type { VetoState } from "./vetoMachine";

const KEY_PREFIX = "valorant-veto-room:";
const ROOM_TTL_SECONDS = 60 * 60 * 12;

type MemoryStore = Map<string, VetoState>;

const memoryStore: MemoryStore =
  ((globalThis as typeof globalThis & { __valorantVetoRooms?: MemoryStore }).__valorantVetoRooms ??=
    new Map());

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return Redis.fromEnv();
}

function roomKey(roomId: string) {
  return `${KEY_PREFIX}${roomId}`;
}

export function isValidRoomId(roomId: string) {
  return /^[a-zA-Z0-9_-]{6,64}$/.test(roomId);
}

export async function getRoomState(roomId: string): Promise<VetoState | null> {
  const redis = getRedis();

  if (redis) {
    return (await redis.get<VetoState>(roomKey(roomId))) ?? null;
  }

  return memoryStore.get(roomId) ?? null;
}

export async function setRoomState(roomId: string, state: VetoState) {
  const redis = getRedis();

  if (redis) {
    await redis.set(roomKey(roomId), state, { ex: ROOM_TTL_SECONDS });
    return;
  }

  memoryStore.set(roomId, state);
}
