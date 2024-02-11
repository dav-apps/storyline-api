import { PrismaClient } from "@prisma/client"
import { RedisClientType } from "redis"

export interface ResolverContext {
	prisma: PrismaClient
	redis: RedisClientType<any, any, any>
}

export interface QueryResult<T> {
	caching: boolean
	data: T
}

export interface List<T> {
	total: number
	items: T[]
}

export interface ApiError {
	code: string
	message: string
	status?: number
}
