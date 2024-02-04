import { ApifyClient } from "apify-client"

export interface ResolverContext {
	apify: ApifyClient
}

export interface ApiError {
	code: string
	message: string
	status?: number
}
