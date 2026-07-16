export function mergePlanAvailability(planOptions, availablePlans) {
  const byCode = new Map(
    (availablePlans || []).map((p) => [p.plan_code, p])
  );
  return (planOptions || [])
    .filter((option) => byCode.has(option.code))
    .map((option) => ({ ...option, ...byCode.get(option.code) }));
}
