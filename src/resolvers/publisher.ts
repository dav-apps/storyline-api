import { Publisher, Feed, Article } from "@prisma/client"
import { ResolverContext, QueryResult, List } from "../types.js"
import { randomNumber, throwApiError, throwValidationError } from "../utils.js"
import { apiErrors } from "../errors.js"
import { admins } from "../constants.js"
import {
	validateDescriptionLength,
	validateNameLength,
	validateUrl,
	validateLogoUrl
} from "../services/validationService.js"

export async function createPublisher(
	parent: any,
	args: {
		name: string
		description?: string
		url: string
		logoUrl: string
	},
	context: ResolverContext
): Promise<Publisher> {
	const user = context.user

	// Check if the user is logged in
	if (user == null) {
		throwApiError(apiErrors.notAuthenticated)
	}

	// Check if the user is an admin
	if (!admins.includes(user.id)) {
		throwApiError(apiErrors.actionNotAllowed)
	}

	// Validate the args
	let validations = [validateNameLength(args.name)]

	if (args.description != null) {
		validations.push(validateDescriptionLength(args.description))
	}

	validations.push(validateUrl(args.url))
	validations.push(validateLogoUrl(args.logoUrl))

	throwValidationError(...validations)

	// Create the publisher
	return await context.prisma.publisher.create({
		data: {
			name: args.name,
			description: args.description,
			url: args.url,
			logoUrl: args.logoUrl
		}
	})
}

export async function retrievePublisher(
	parent: any,
	args: { uuid: string },
	context: ResolverContext
): Promise<QueryResult<Publisher>> {
	return {
		caching: true,
		data: await context.prisma.publisher.findFirst({
			where: { uuid: args.uuid }
		})
	}
}

export async function listPublishers(
	parent: any,
	args: {
		random?: boolean
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<QueryResult<List<Publisher>>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	const random = args.random || false

	if (random) {
		let total = await context.prisma.publisher.count()
		if (take > total) take = total

		let indices = []
		let items = []

		while (indices.length < take) {
			let i = randomNumber(0, total - 1)

			if (!indices.includes(i)) {
				indices.push(i)
			}
		}

		for (let i of indices) {
			items.push(await context.prisma.publisher.findFirst({ skip: i }))
		}

		return {
			caching: true,
			data: {
				total,
				items
			}
		}
	} else {
		const [total, items] = await context.prisma.$transaction([
			context.prisma.publisher.count(),
			context.prisma.publisher.findMany({
				take,
				skip
			})
		])

		return {
			caching: true,
			data: {
				total,
				items
			}
		}
	}
}

export async function feeds(
	publisher: Publisher,
	args: {
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<QueryResult<List<Feed>>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	let where = { publisherId: publisher.id }

	const [total, items] = await context.prisma.$transaction([
		context.prisma.feed.count({ where }),
		context.prisma.feed.findMany({
			take,
			skip,
			where
		})
	])

	return {
		caching: true,
		data: {
			total,
			items
		}
	}
}

export async function articles(
	publisher: Publisher,
	args: {
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<QueryResult<List<Article>>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	const where = {
		feeds: {
			some: {
				publisherId: publisher.id
			}
		}
	}

	const [total, items] = await context.prisma.$transaction([
		context.prisma.article.count({ where }),
		context.prisma.article.findMany({
			take,
			skip,
			where,
			orderBy: { date: "desc" }
		})
	])

	return {
		caching: true,
		data: {
			total,
			items
		}
	}
}
