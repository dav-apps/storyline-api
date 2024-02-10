import * as publisherResolvers from "./resolvers/publisher.js"
import * as articleResolvers from "./resolvers/article.js"

export const resolvers = {
	Query: {
		retrievePublisher: publisherResolvers.retrievePublisher,
		retrieveArticle: articleResolvers.retrieveArticle,
		listArticles: articleResolvers.listArticles
	},
	Publisher: {
		articles: publisherResolvers.articles
	},
	Article: {
		publisher: articleResolvers.publisher,
		content: articleResolvers.content
	}
}
