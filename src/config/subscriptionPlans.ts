export const subscriptionPlans = {
    free: {
        price: 0,
        maxProjects: 3,
        maxMembersPerProject: 3,
        maxTasksPerProject: 5
    },

    pro: {
        price: 499,
        maxProjects: 15,
        maxMembersPerProject: 10,
        maxTasksPerProject: 50
    },

    team: {
        price: 999,
        maxProjects: 100,
        maxMembersPerProject: 50,
        maxTasksPerProject: 200
    }
} as const;

export type SubscriptionPlan =
    keyof typeof subscriptionPlans;