import { createMemoryStorage } from "./memory.js";
import { createMongoStorage } from "./mongo.js";

export function createStorage({ mongoConnected }) {
  return mongoConnected ? createMongoStorage() : createMemoryStorage();
}

