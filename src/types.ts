import { PrismaClient } from "@prisma/client"
import { RedisClientType } from "redis"
import OpenAI from "openai"
import { Telegraf } from "telegraf"
import { User } from "dav-js"

export interface ResolverContext {
	prisma: PrismaClient
	redis: RedisClientType<any, any, any>
	openai: OpenAI
	telegraf: Telegraf
	accessToken?: string
	user?: User
}

export interface QueryResult<T> {
	caching: boolean
	expiration?: number
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

//#region Platform models
export interface TableObject {
	uuid: string
	user: any
	tableId: number
	properties: { [key: string]: string | number | boolean }
}

export interface Notification {
	uuid: string
	time: string
	interval: number
	title: string
	body: string
}
//#endregion
