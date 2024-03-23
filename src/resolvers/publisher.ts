import { Publisher, Feed, Article } from "@prisma/client"
import validator from "validator"
import { ResolverContext, QueryResult, List } from "../types.js"
import {
	throwApiError,
	throwValidationError,
	randomNumber,
	stringToSlug
} from "../utils.js"
import { apiErrors } from "../errors.js"
import { admins } from "../constants.js"
import {
	validateNameLength,
	validateDescriptionLength,
	validateUrl,
	validateLogoUrl
} from "../services/validationService.js"

export async function createPublisher(
	parent: any,
	args: {
		name: string
		description: string
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
			slug: stringToSlug(args.name),
			name: args.name,
			description: args.description,
			url: args.url,
			logoUrl: args.logoUrl
		}
	})
}

export async function updatePublisher(
	parent: any,
	args: {
		uuid: string
		name?: string
		description?: string
		url?: string
		logoUrl?: string
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

	// Try to find the publisher
	let publisher = await context.prisma.publisher.findFirst({
		where: { uuid: args.uuid }
	})

	if (publisher == null) {
		throwApiError(apiErrors.publisherDoesNotExist)
	}

	// Validate the args
	let validations = []
	let data: any = {}

	if (args.name != null) {
		validations.push(validateNameLength(args.name))
		data.name = args.name
	}

	if (args.description != null) {
		validations.push(validateDescriptionLength(args.description))
		data.description = args.description
	}

	if (args.url != null) {
		validations.push(validateUrl(args.url))
		data.url = args.url
	}

	if (args.logoUrl != null) {
		validations.push(validateLogoUrl(args.logoUrl))
		data.logoUrl = args.logoUrl
	}

	throwValidationError(...validations)

	// Update the publisher
	return await context.prisma.publisher.update({
		where: { id: publisher.id },
		data
	})
}

export async function retrievePublisher(
	parent: any,
	args: { uuid: string },
	context: ResolverContext
): Promise<QueryResult<Publisher>> {
	if (validator.isUUID(args.uuid)) {
		return {
			caching: true,
			data: await context.prisma.publisher.findFirst({
				where: { uuid: args.uuid }
			})
		}
	} else {
		return {
			caching: true,
			data: await context.prisma.publisher.findFirst({
				where: { slug: args.uuid }
			})
		}
	}
}

export async function listPublishers(
	parent: any,
	args: {
		random?: boolean
		languages?: string[]
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
	let languages: string[] = []
	let where = {}

	if (args.languages != null) {
		for (let lang of args.languages) {
			languages.push(lang.split("-")[0])
		}

		where = { feeds: { some: { language: { in: languages } } } }
	}

	if (random) {
		let total = await context.prisma.publisher.count({
			where,
			orderBy: { id: "asc" }
		})

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
			items.push(
				await context.prisma.publisher.findFirst({
					where,
					orderBy: { id: "asc" },
					skip: i
				})
			)
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
			context.prisma.publisher.count({ where }),
			context.prisma.publisher.findMany({
				where,
				take,
				skip,
				orderBy: { name: "asc" }
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
		hasName?: boolean
		limit?: number
		offset?: number
	},
	context: ResolverContext
): Promise<QueryResult<List<Feed>>> {
	let take = args.limit ?? 10
	if (take <= 0) take = 10

	let skip = args.offset ?? 0
	if (skip < 0) skip = 0

	let hasName = args.hasName ?? false
	let where: any = { publisherId: publisher.id }

	if (hasName) {
		where.name = { not: null }
	}

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
		expiration: 60 * 60 * 2, // 2 hours
		data: {
			total,
			items
		}
	}
}
