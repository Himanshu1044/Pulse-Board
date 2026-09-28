import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { getProjectMemberRole } from "./services/projectMemberService";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

interface JwtPayload {
    userId: string;
}

export const setupSocket = (io: Server) => {
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(
                    new Error("Authentication required")
                );
            }

            const decoded = jwt.verify(
                token,
                JWT_SECRET
            ) as JwtPayload;

            socket.data.userId = decoded.userId;

            next();
        } catch {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        const userRoom = `user:${socket.data.userId}`;

        socket.join(userRoom);

        console.log(
            "Socket connected:",
            socket.id,
            "user:",
            socket.data.userId
        );

        socket.on(
            "join_project",
            async (
                projectId: string,
                callback?: (response: {
                    success: boolean;
                    message?: string;
                }) => void
            ) => {
                try {
                    const role = await getProjectMemberRole(
                        projectId,
                        socket.data.userId
                    );

                    if (!role) {
                        callback?.({
                            success: false,
                            message: "You are not a member of this project"
                        });

                        return;
                    }

                    const room = `project:${projectId}`;

                    await socket.join(room);

                    console.log(
                        `User ${socket.data.userId} joined ${room}`
                    );

                    callback?.({
                        success: true
                    });
                } catch (error) {
                    console.error(error);

                    callback?.({
                        success: false,
                        message: "Failed to join project"
                    });
                }
            }
        );

        socket.on("leave_project", async (projectId: string) => {
            const room = `project:${projectId}`;

            await socket.leave(room);

            console.log(
                `User ${socket.data.userId} left ${room}`
            );
        });

        socket.on("disconnect", () => {
            console.log(
                "Socket disconnected:",
                socket.id
            );
        });
    });
};