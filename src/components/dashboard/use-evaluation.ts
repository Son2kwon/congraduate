"use client";

import { useMemo } from "react";
import { useImport } from "../import/import-provider";
import { visibleRecords } from "../../features/import/model";
import { rules, courseIndex } from "../../features/import/data";
import { compareEvaluations } from "../../features/dashboard/model";

export function useEvaluation() {
  const state=useImport();
  const {workspace}=state;
  const records=useMemo(()=>visibleRecords(workspace.draft),[workspace.draft]);
  const result=useMemo(()=>workspace.student ? compareEvaluations({rules,courses:courseIndex,records,student:workspace.student,standard:workspace.standard??undefined}) : null,[records,workspace.student,workspace.standard]);
  const context=useMemo(()=>workspace.student ? {termOrder:rules.counting.term_order,categoryGroups:rules.classification.category_groups,courses:courseIndex,student:workspace.student} : null,[workspace.student]);
  return {...state,records,result,context};
}
