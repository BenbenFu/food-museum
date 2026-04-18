const dateFmt = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  weekday: "short"
});

export const formatEatenAt = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  return dateFmt.format(new Date(year, (month ?? 1) - 1, day ?? 1));
};