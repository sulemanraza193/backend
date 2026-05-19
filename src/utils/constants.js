export const userRolesEnum = {
    ADMIN: "admin",
    PROJECT_MANAGER: "project_manager",
    MEMBER: "member",

};

export const AvailableUserRules = Object.values(userRolesEnum)

export const taskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
}
export const AvailableTaskRules = Object.values(taskStatusEnum)
