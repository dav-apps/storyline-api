import { Feed } from "@prisma/client"
import Parser from "rss-parser"
import { QueryResult, ResolverContext } from "../types.js"
import { throwApiError, throwValidationError } from "../utils.js"
import { apiErrors } from "../errors.js"
import { admins } from "../constants.js"
import {
	validateNameLength,
	validateDescriptionLength,
	validateUrl,
	validateLanguage
} from "../services/validationService.js"

export async function createFeed(
	parent: any,
	args: {
		publisherUuid: string
		url: string
	},
	context: ResolverContext
): Promise<Feed> {
	const user = context.user

	// Check if the user is logged in
	if (user == null) {
		throwApiError(apiErrors.notAuthenticated)
	}

	// Check if the user is an admin
	if (!admins.includes(user.id)) {
		throwApiError(apiErrors.actionNotAllowed)
	}

	// Try to get the publisher
	const publisher = await context.prisma.publisher.findFirst({
		where: { uuid: args.publisherUuid }
	})

	if (publisher == null) {
		throwApiError(apiErrors.publisherDoesNotExist)
	}

	// Validate the url
	throwValidationError(validateUrl(args.url))

	// Retrieve the feed info
	const parser = new Parser({ customFields: { feed: ["language"] } })
	const feed = await parser.parseURL(args.url)

	const name = feed.title
	const description = feed.description
	const language = (feed.language as string).toLowerCase() || "en"

	// Validate the args
	throwValidationError(
		validateNameLength(name),
		validateDescriptionLength(description),
		validateLanguage(language)
	)

	// Create the feed
	return await context.prisma.feed.create({
		data: {
			publisherId: publisher.id,
			url: args.url,
			name,
			description,
			language
		}
	})
}

export async function retrieveFeed(
	parent: any,
	args: {
		uuid: string
	},
	context: ResolverContext
): Promise<QueryResult<Feed>> {
	return {
		caching: true,
		data: await context.prisma.feed.findFirst({
			where: { uuid: args.uuid }
		})
	}
}
