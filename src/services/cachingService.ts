import { Plan } from "dav-js"
import { ResolverContext, QueryResult } from "../types.js"
import { defaultCacheExpiration, feedCacheExpiration } from "../constants.js"

function generateCacheKey(
	resolverName: string,
	uuid: string,
	args: object
): string {
	let result = `${resolverName}`

	if (uuid != null) {
		result += `:${uuid}`
	}

	for (let key of Object.keys(args)) {
		let value = args[key]
		result += `,${key}:${value}`
	}

	return result
}

export async function cachingResolver(
	parent: any,
	args: any,
	context: ResolverContext,
	info: any,
	resolver: Function,
	skipCachingForPlusUsers: boolean = false
) {
	if (
		process.env.CACHING == "false" ||
		(skipCachingForPlusUsers &&
			context.user != null &&
			context.user.Plan != Plan.Free)
	) {
		let result: QueryResult<any> = await resolver(parent, args, context)
		return result.data
	}

	// Check if the result is cached
	let key = generateCacheKey(
		`${info.path.typename}-${info.path.key}`,
		parent?.uuid,
		args
	)
	let cachedResult = await context.redis.get(key)

	if (cachedResult != null) {
		return JSON.parse(cachedResult)
	}

	// Call the resolver function and save the result
	let result: QueryResult<any> = await resolver(parent, args, context)

	if (result.caching) {
		await context.redis.set(key, JSON.stringify(result.data))
		await context.redis.expire(
			key,
			result.expiration ?? defaultCacheExpiration
		)
	}

	return result.data
}

export async function feedCachingResolver(
	parent: any,
	args: { excludeFeeds?: string[] },
	context: ResolverContext,
	info: any,
	resolver: Function
) {
	if (process.env.CACHING == "false") {
		let result: QueryResult<any> = await resolver(parent, args, context)
		return result.data
	}

	if (
		context.user == null ||
		context.user.Plan == Plan.Free ||
		args.excludeFeeds == null
	) {
		return await cachingResolver(parent, args, context, info, resolver, true)
	}

	// Check if the result is cached
	let key = generateUserFeedCacheKey(args)
	let cachedResult = await context.redis.get(key)

	if (cachedResult != null) {
		// Reset the expiration time
		await context.redis.expire(key, feedCacheExpiration)

		return JSON.parse(cachedResult)
	}

	// Call the resolver function and save the result
	let result: QueryResult<any> = await resolver(parent, args, context)

	if (result.caching) {
		await context.redis.set(key, JSON.stringify(result.data))
		await context.redis.expire(key, feedCacheExpiration)
	}

	return result.data
}

function generateUserFeedCacheKey(args: object): string {
	return `feed,${JSON.stringify(args)}`
}
