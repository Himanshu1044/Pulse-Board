export const canCreateTask = (role: string) => {
  return ["owner", "manager", "member"].includes(role);
};