import { Router, type IRouter } from "express";
import { MUNICIPALITIES, getMunicipalityById } from "../rules/municipalities";
import { GetMunicipalityByIdParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/municipalities", (_req, res) => {
  const list = MUNICIPALITIES.map(({ id, name, nameJa, prefecture, prefectureJa, collectionDays, website, hotline }) => ({
    id,
    name,
    nameJa,
    prefecture,
    prefectureJa,
    collectionDays,
    website,
    hotline,
  }));
  res.json({ municipalities: list });
});

router.get("/municipalities/:municipalityId", (req, res) => {
  const parsed = GetMunicipalityByIdParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid parameters", details: parsed.error.message });
    return;
  }

  const profile = getMunicipalityById(parsed.data.municipalityId);
  if (!profile) {
    res.status(404).json({ error: "Municipality not found" });
    return;
  }

  const { items: _items, ...rest } = profile;
  res.json(rest);
});

export default router;
