export const subscriptionPlans = {
    free: {
        price: 0,
        maxProjects: 3,
        maxMembersPerProject: 5,
        maxTasksPerProject: 100
    },

    pro: {
        price: 499,
        maxProjects: 20,
        maxMembersPerProject: 20,
        maxTasksPerProject: 1000
    },

    team: {
        price: 999,
        maxProjects: 100,
        maxMembersPerProject: 100,
        maxTasksPerProject: 10000
    }
} as const;

export type SubscriptionPlan =
    keyof typeof subscriptionPlans;