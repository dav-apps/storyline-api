import { Response } from "express"
import { GraphQLError } from "graphql"
import Parser from "rss-parser"
import urlMetadata from "url-metadata"
import * as crypto from "crypto"
import { ApiError } from "./types.js"
import { apiErrors } from "./errors.js"
import { prisma } from "../server.js"

export function throwApiError(error: ApiError) {
	throw new GraphQLError(error.message, {
		extensions: {
			code: error.code,
			http: {
				status: 200
			}
		}
	})
}

export function throwValidationError(...errors: string[]) {
	let filteredErrors = errors.filter(e => e != null)

	if (filteredErrors.length > 0) {
		throw new GraphQLError(apiErrors.validationFailed.message, {
			extensions: {
				code: apiErrors.validationFailed.code,
				errors: filteredErrors
			}
		})
	}
}

export function throwEndpointError(error?: ApiError) {
	if (error == null) return

	throw new Error(error.code)
}

export function handleEndpointError(res: Response, e: Error) {
	// Find the error by error code
	let error = Object.values(apiErrors).find(err => err.code == e.message)

	if (error != null) {
		sendEndpointError(res, error)
	} else {
		sendEndpointError(res, apiErrors.unexpectedError)
	}
}

function sendEndpointError(res: Response, error: ApiError) {
	res.status(error.status || 400).json({
		code: error.code,
		message: error.message
	})
}

export async function fetchArticles() {
	const parser = new Parser()
	const feeds = await prisma.feed.findMany()

	for (let f of feeds) {
		const feed = await parser.parseURL(f.url)

		for (let feedItem of feed.items) {
			if (feedItem.guid == null) continue

			// Try to find the article in the database
			const article = await prisma.article.findFirst({
				where: { uuid: feedItem.guid },
				include: { feeds: true }
			})

			if (article == null) {
				const uuid = crypto.randomUUID()
				const title = feedItem.title

				// Get the metadata, to get the image url
				const metadata = await urlMetadata(feedItem.link)
				const imageUrl = metadata["og:image"]

				try {
					await prisma.article.create({
						data: {
							uuid,
							feeds: { connect: { id: f.id } },
							slug: `${stringToSlug(title)}-${uuid}`,
							url: feedItem.link,
							title: feedItem.title,
							description: feedItem.contentSnippet,
							date: new Date(feedItem.pubDate),
							imageUrl: imageUrl ? imageUrl : null,
							content: feedItem.content?.trim()
						}
					})
				} catch (error) {
					console.error(error)
				}
			} else {
				// Check if the article already belongs to the feed
				let i = article.feeds.findIndex(item => item.id == f.id)

				if (i == -1) {
					// Add the article to the current feed
					await prisma.article.update({
						where: { id: article.id },
						data: { feeds: { connect: { id: f.id } } }
					})
				}
			}
		}
	}
}

export function randomNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function stringToSlug(str: string): string {
	str = str.replace(/^\s+|\s+$/g, "") // trim
	str = str.toLowerCase()

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;"
	var to = "aaaaeeeeiiiioooouuuunc------"
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i))
	}

	str = str
		.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
		.replace(/\s+/g, "-") // collapse whitespace and replace by -
		.replace(/-+/g, "-") // collapse dashes

	return str
}
