import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { makeExecutableSchema } from "@graphql-tools/schema"
import express from "express"
import http from "http"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import OpenAI from "openai"
import { createClient } from "redis"
import { DateTime } from "luxon"
import { Telegraf } from "telegraf"
import { Dav, Environment, User, UsersController } from "dav-js"
import { typeDefs } from "./src/typeDefs.js"
import { resolvers } from "./src/resolvers.js"
import { throwApiError, fetchArticles, updateFeedCaches } from "./src/utils.js"
import { apiErrors } from "./src/errors.js"
import "dotenv/config"

const port = process.env.PORT || 4004
const app = express()
const httpServer = http.createServer(app)

let schema = makeExecutableSchema({
	typeDefs,
	resolvers
})

export const prisma = new PrismaClient()

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_SECRET_KEY
})

export const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

//#region Redis config
export const redis = createClient({
	url: process.env.REDIS_URL,
	database: process.env.ENVIRONMENT == "production" ? 9 : 8 // production: 9, staging: 8
})

redis.on("error", err => {})
await redis.connect()
//#endregion

const server = new ApolloServer({
	schema,
	plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
})

await server.start()

// Init dav
let environment = Environment.Development

switch (process.env.ENVIRONMENT) {
	case "production":
		environment = Environment.Production
		break
	case "staging":
		environment = Environment.Staging
		break
}

new Dav({
	environment,
	server: true
})

app.use(
	"/",
	cors<cors.CorsRequest>(),
	express.json({ type: "application/json", limit: "50mb" }),
	expressMiddleware(server, {
		context: async ({ req }) => {
			const accessToken = req.headers.authorization
			let user: User = null

			if (accessToken != null) {
				let userResponse = await UsersController.retrieveUser(
					`
						id
						plan
					`,
					{
						accessToken
					}
				)

				if (!Array.isArray(userResponse)) {
					user = userResponse
				} else if (userResponse.includes("SESSION_EXPIRED")) {
					throwApiError(apiErrors.sessionExpired)
				}
			}

			return {
				prisma,
				redis,
				openai,
				telegraf,
				accessToken,
				user
			}
		}
	})
)

await new Promise<void>(resolve => httpServer.listen({ port }, resolve))
console.log(`🚀 Server ready at http://localhost:${port}/`)

BigInt.prototype["toJSON"] = function () {
	return this.toString()
}

if (
	environment == Environment.Staging ||
	environment == Environment.Production
) {
	let interval = 1000 * 60 * 60 * 6 // 6 hours

	if (environment == Environment.Production) {
		interval = 1000 * 60 * 60 // 1 hour
	}

	while (true) {
		let before = DateTime.now()

		console.log("---------------")
		console.log("Starting to fetch articles...")
		console.log(`Start time: ${before.toString()}`)

		let fetchArticlesResult = await fetchArticles()

		console.log(`${fetchArticlesResult.newArticlesCount} new articles added`)
		console.log(
			`Runtime: ${Math.floor(-before.diffNow("minutes").minutes)} minutes`
		)

		before = DateTime.now()

		console.log("\nStarting to update feed caches...")
		console.log(`Start time: ${before.toString()}`)

		let updateFeedCachesResult = await updateFeedCaches()

		console.log(`${updateFeedCachesResult.updatedFeedsCount} caches updated`)
		console.log(
			`Runtime: ${Math.floor(-before.diffNow("minutes").minutes)} minutes`
		)

		await new Promise(resolve => setTimeout(resolve, interval))
	}
}
