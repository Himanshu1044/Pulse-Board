export const canCreateTask = (role: string) => {
  return ["owner", "manager", "member"].includes(role);
};

export const canComment = (role: string) => {
    return ["owner", "manager", "member"].includes(role);
};