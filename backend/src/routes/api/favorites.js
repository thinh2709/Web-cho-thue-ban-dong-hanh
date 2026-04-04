import { Router } from "express";
import path from "node:path";
import { getCompanionById } from "../../data/companions.js";
import { readJson, writeJson } from "../../storage/jsonStore.js";

const router = Router();

const defaultUserId = "demo-user";
const storePath = path.resolve(process.cwd(), "data", "favorites.json");

function getUserId(req) {
  return req.header("x-user-id") || defaultUserId;
}

async function loadStore() {
  return await readJson(storePath, {});
}

async function saveStore(store) {
  await writeJson(storePath, store);
}

function hydrateFavorites(items) {
  return items
    .map((i) => {
      const companion = getCompanionById(i.companionId);
      if (!companion) return null;
      return { ...companion, companionId: i.companionId, createdAt: i.createdAt };
    })
    .filter(Boolean);
}

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  const store = await loadStore();
  const items = store[userId] || [];
  res.status(200).json({ userId, favorites: hydrateFavorites(items) });
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { companionId } = req.body ?? {};

  if (!companionId || typeof companionId !== "string") {
    res.status(400).json({ error: "companionId is required" });
    return;
  }

  if (!getCompanionById(companionId)) {
    res.status(404).json({ error: "companion not found" });
    return;
  }

  const store = await loadStore();
  const items = store[userId] || [];

  if (items.some((f) => f.companionId === companionId)) {
    res.status(200).json({ userId, favorites: hydrateFavorites(items) });
    return;
  }

  items.unshift({ companionId, createdAt: new Date().toISOString() });
  store[userId] = items;
  await saveStore(store);

  res.status(201).json({ userId, favorites: hydrateFavorites(items) });
});

router.delete("/:companionId", async (req, res) => {
  const userId = getUserId(req);
  const { companionId } = req.params;
  const store = await loadStore();
  const items = store[userId] || [];
  const next = items.filter((f) => f.companionId !== companionId);
  store[userId] = next;
  await saveStore(store);
  res.status(200).json({ userId, favorites: hydrateFavorites(next) });
});

export default router;
