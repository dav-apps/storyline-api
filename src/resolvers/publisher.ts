import { Article, Publisher } from "@prisma/client"
import { ResolverContext, QueryResult, List } from "../types.js"

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
