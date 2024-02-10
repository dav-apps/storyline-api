import { PrismaClient } from "@prisma/client"

export interface ResolverContext {
	prisma: PrismaClient
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
