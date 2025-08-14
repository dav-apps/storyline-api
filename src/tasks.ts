import nodeCron from "node-cron"
import { prisma } from "../server.js"

const timezone = "Etc/UTC"

export async function setupTasks() {
	nodeCron.schedule("0 3 * * *", deleteOldArticles, { timezone })
}

async function deleteOldArticles() {
	await prisma.article.deleteMany({
		where: {
			createdAt: {
				lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) // 90 days ago
			}
		}
	})
}
