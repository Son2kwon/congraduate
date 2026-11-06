import type { EvalContext } from "../../engine/context";
import { earnedRecords } from "../../engine/records";
import { courseState } from "../../engine/evaluators/result";
import type { Checklist, ChooseN } from "../../engine/schema";
import type { CourseRecord, ManualInput } from "../../engine/types";

export function toggleItem(manual:ManualInput,req:Checklist|ChooseN,id:string,checked:boolean):ManualInput {
  const allowed=req.type==="checklist" ? req.items.includes(id) : req.items.some(item=>item.id===id&&!item.auto_from_course);
  if(!allowed) return manual;
  const values=new Set(manual.checked[req.id]??[]);
  if(checked) values.add(id); else values.delete(id);
  return {...manual,checked:{...manual.checked,[req.id]:[...values]}};
}
export function checklistItems(req:Checklist|ChooseN,manual:ManualInput,records:CourseRecord[],c:EvalContext) {
  const checked=new Set(manual.checked[req.id]??[]);
  const earned=earnedRecords(records.filter(r=>r.source!=="plan"),c);
  return req.type==="checklist"
    ? req.items.map(label=>({id:label,label,checked:checked.has(label),automatic:false}))
    : req.items.map(item=>({id:item.id,label:item.label,checked:item.auto_from_course ? courseState(item.auto_from_course,earned,c)==="done" : checked.has(item.id),automatic:!!item.auto_from_course}));
}
