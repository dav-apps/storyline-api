import { Article, Feed } from "@prisma/client"
import { Response } from "express"
import { GraphQLError } from "graphql"
import Parser from "rss-parser"
import urlMetadata from "url-metadata"
import * as crypto from "crypto"
import { DateTime } from "luxon"
import { listArticles } from "./resolvers/article.js"
import {
	listTableObjectsByProperty,
	createNotification
} from "./services/apiService.js"
import { ApiError } from "./types.js"
import { apiErrors } from "./errors.js"
import {
	apiBaseUrlDevelopment,
	apiBaseUrlStaging,
	apiBaseUrlProduction,
	newApiBaseUrlDevelopment,
	newApiBaseUrlStaging,
	newApiBaseUrlProduction,
	websiteBaseUrlDevelopment,
	websiteBaseUrlStaging,
	websiteBaseUrlProduction,
	appId,
	followTableName,
	followTablePublisherKey,
	followTableExcludedFeedsKey,
	notificationTableName,
	notificationTablePublisherKey
} from "./constants.js"
import { prisma, redis, openai, telegraf } from "../server.js"

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

export function getApiBaseUrl(): string {
	switch (process.env.ENVIRONMENT) {
		case "staging":
			return apiBaseUrlStaging
		case "production":
			return apiBaseUrlProduction
		default:
			return apiBaseUrlDevelopment
	}
}

export function getNewApiBaseUrl(): string {
	switch (process.env.ENVIRONMENT) {
		case "staging":
			return newApiBaseUrlStaging
		case "production":
			return newApiBaseUrlProduction
		default:
			return newApiBaseUrlDevelopment
	}
}

export function getWebsiteBaseUrl(): string {
	switch (process.env.ENVIRONMENT) {
		case "staging":
			return websiteBaseUrlStaging
		case "production":
			return websiteBaseUrlProduction
		default:
			return websiteBaseUrlDevelopment
	}
}

export async function fetchArticles(): Promise<{ newArticlesCount: number }> {
	const parser = new Parser()
	const feeds = await prisma.feed.findMany()

	let newArticlesCount = 0

	for (let f of feeds) {
		let feed = null

		try {
			feed = await parser.parseURL(f.url)
		} catch (error) {
			console.error("Error in trying to parse the following URL: ", f.url)
			console.error(error)
			continue
		}

		for (let feedItem of feed.items) {
			// Try to find the article in the database
			const article = await prisma.article.findFirst({
				where: { url: feedItem.link },
				include: { feeds: true }
			})

			if (article == null) {
				const uuid = crypto.randomUUID()
				const title = feedItem.title

				// Get the metadata, to get the image url
				let imageUrl = ""

				try {
					const metadata = await urlMetadata(feedItem.link)
					imageUrl = metadata["og:image"]
				} catch (error) {
					continue
				}

				try {
					const article = await prisma.article.create({
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

					// Send notifications for the article
					await sendNotificationsForArticle(article, f)
					await sendTelegramMessage(article, f)

					newArticlesCount++
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

	return { newArticlesCount }
}

export async function updateFeedCaches(): Promise<{
	updatedFeedsCount: number
}> {
	let keys = await redis.keys("feed,*")
	let updatedFeedsCount = 0

	for (let key of keys) {
		// Retrieve the params from the key
		let rawParams = key.split(",")
		rawParams.splice(0, 1)
		let paramsString = rawParams.join(",")
		let params: any = null

		try {
			params = JSON.parse(paramsString)
		} catch (error) {
			continue
		}

		let result = await listArticles(null, params, {
			prisma,
			redis,
			openai,
			telegraf
		})
		await redis.set(key, JSON.stringify(result.data), { KEEPTTL: true })
		updatedFeedsCount++
	}

	return { updatedFeedsCount }
}

async function sendNotificationsForArticle(article: Article, feed: Feed) {
	const publisher = await prisma.publisher.findFirst({
		where: { id: feed.publisherId }
	})

	// Find all Notification table objects with the publisher of the feed
	const listNotificationTableObjectsResult = await listTableObjectsByProperty(
		`
			total
			items {
				uuid
				user {
					id
				}
			}
		`,
		{
			limit: 1000000,
			appId,
			tableName: notificationTableName,
			propertyName: notificationTablePublisherKey,
			propertyValue: publisher.uuid
		}
	)

	for (let notificationObj of listNotificationTableObjectsResult.items) {
		// Get the follow table object
		const listFollowTableObjectsResult = await listTableObjectsByProperty(
			`
				total
				items {
					uuid
					properties
				}
			`,
			{
				limit: 1,
				appId,
				userId: notificationObj.user.id,
				tableName: followTableName,
				propertyName: followTablePublisherKey,
				propertyValue: publisher.uuid
			}
		)

		if (
			listFollowTableObjectsResult == null ||
			listFollowTableObjectsResult.total == 0
		) {
			continue
		}

		// Check if the user has excluded the feed
		let properties = listFollowTableObjectsResult.items[0].properties
		let excludedFeedsProperty = properties[
			followTableExcludedFeedsKey
		] as string

		if (
			excludedFeedsProperty != null &&
			excludedFeedsProperty.includes(feed.uuid)
		) {
			continue
		}

		await createNotification(`uuid`, {
			userId: notificationObj.user.id,
			appId,
			time: Math.floor(DateTime.now().toSeconds()),
			interval: 0,
			title: truncateString(article.title, 40),
			body: truncateString(article.description, 150),
			icon: publisher.logoUrl,
			image: article.imageUrl,
			href: `${getWebsiteBaseUrl()}/article/${article.slug}`
		})
	}
}

export async function sendTelegramMessage(article: Article, feed: Feed) {
	if (feed.telegramChannelId == null) return

	let message = `<a href="${getWebsiteBaseUrl()}/article/${article.slug}">${
		article.title
	}</a>`

	await telegraf.telegram.sendMessage(feed.telegramChannelId, message, {
		parse_mode: "HTML"
	})
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

	return str
		.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
		.replace(/\s+/g, "-") // collapse whitespace and replace by -
		.replace(/-+/g, "-") // collapse dashes
}

function truncateString(str: string, n: number) {
	if (str.length <= n) return str

	const subString = str.slice(0, n - 1)

	return subString.slice(0, subString.lastIndexOf(" ")) + "…"
}
