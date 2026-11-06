import majorJson from "../../../data/catalog/courses_cau_sw.json";
import liberalJson from "../../../data/catalog/liberal_arts_2026_1.json";
import rulesJson from "../../../data/rules/cau_sw_2022.rules.json";
import { MajorCatalog, LiberalCatalog, RuleFile } from "../../engine/schema";
import { createCourseIndex } from "../../engine/courses";
import { buildCatalog } from "./catalog";

const major = MajorCatalog.parse(majorJson);
const liberal = LiberalCatalog.parse(liberalJson);
export const catalog = buildCatalog(major, liberal);
export const rules = RuleFile.parse(rulesJson);
export const courseIndex = createCourseIndex(major, liberal);
