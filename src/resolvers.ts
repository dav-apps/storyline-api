import { ResolverContext } from "./types.js"
import { cachingResolver } from "./services/cachingService.js"
import * as publisherResolvers from "./resolvers/publisher.js"
import * as feedResolvers from "./resolvers/feed.js"
import * as articleResolvers from "./resolvers/article.js"

export const resolvers = {
	Query: {
		retrievePublisher: (
			parent: any,
			args: any,
			context: ResolverContext,
			info: any
		) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				publisherResolvers.retrievePublisher
			),
		listPublishers: (
			parent: any,
			args: any,
			context: ResolverContext,
			info: any
		) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				publisherResolvers.listPublishers
			),
		retrieveArticle: (
			parent: any,
			args: any,
			context: ResolverContext,
			info: any
		) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				articleResolvers.retrieveArticle
			),
		listArticles: (
			parent: any,
			args: any,
			context: ResolverContext,
			info: any
		) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				articleResolvers.listArticles
			)
	},
	Mutation: {
		createPublisher: publisherResolvers.createPublisher,
		createFeed: feedResolvers.createFeed
	},
	Publisher: {
		feeds: (parent: any, args: any, context: ResolverContext, info: any) =>
			cachingResolver(parent, args, context, info, publisherResolvers.feeds),
		articles: (parent: any, args: any, context: ResolverContext, info: any) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				publisherResolvers.articles
			)
	},
	Article: {
		publisher: (
			parent: any,
			args: any,
			context: ResolverContext,
			info: any
		) =>
			cachingResolver(
				parent,
				args,
				context,
				info,
				articleResolvers.publisher
			),
		summary: (parent: any, args: any, context: ResolverContext, info: any) =>
			cachingResolver(parent, args, context, info, articleResolvers.summary)
	}
}
