import { Response } from "express"
import Parser from "rss-parser"
import urlMetadata from "url-metadata"
import { ApiError } from "./types.js"
import { apiErrors } from "./errors.js"
import { prisma } from "../server.js"

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
	const parser = new Parser({ customFields: { feed: ["copyright"] } })
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
				// Get the metadata, to get the image url
				const metadata = await urlMetadata(feedItem.link)

				await prisma.article.create({
					data: {
						uuid: feedItem.guid,
						feeds: { connect: { id: f.id } },
						url: feedItem.link,
						title: feedItem.title,
						description: feedItem.contentSnippet,
						date: new Date(feedItem.pubDate),
						imageUrl: metadata["og:image"],
						content: feedItem.content
					}
				})
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
