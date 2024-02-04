import { PrismaClient } from "@prisma/client"
import { ApifyClient } from "apify-client"

export interface ResolverContext {
	prisma: PrismaClient
	apify: ApifyClient
}

export interface ApiError {
	code: string
	message: string
	status?: number
}
