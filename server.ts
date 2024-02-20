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
import { Dav, Environment, isSuccessStatusCode } from "dav-js"
import { getUser } from "./src/services/apiService.js"
import { typeDefs } from "./src/typeDefs.js"
import { resolvers } from "./src/resolvers.js"
import { User } from "./src/types.js"
import { throwApiError, fetchArticles } from "./src/utils.js"
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

const openai = new OpenAI({
	apiKey: process.env.OPENAI_SECRET_KEY
})

//#region Redis config
export const redis = createClient({
	url: process.env.REDIS_URL,
	database: process.env.ENVIRONMENT == "production" ? 9 : 8 // production: 9, staging: 8
})

redis.on("error", err => console.log("Redis Client Error", err))
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
				let userResponse = await getUser(accessToken)

				if (isSuccessStatusCode(userResponse.status)) {
					user = userResponse.data
				} else if (
					userResponse.errors != null &&
					userResponse.errors.length > 0 &&
					userResponse.errors[0].code == 3101
				) {
					throwApiError(apiErrors.sessionEnded)
				}
			}

			return {
				prisma,
				redis,
				openai,
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

if (environment == Environment.Staging) {
	while (true) {
		await fetchArticles()
		await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 60 * 6))
	}
}
