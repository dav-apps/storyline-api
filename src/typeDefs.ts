export const typeDefs = `#graphql
	type Query {
		retrievePublisher(uuid: String!): Publisher
		listPublishers(
			limit: Int
			offset: Int
		): PublisherList!
		retrieveArticle(uuid: String!): Article
		listArticles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type Publisher {
		uuid: String!
		name: String!
		description: String!
		url: String!
		logoUrl: String!
		copyright: String!
		articles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type PublisherList {
		total: Int!
		items: [Publisher!]!
	}

	type Article {
		uuid: String!
		publisher: Publisher!
		url: String!
		title: String
		description: String
		date: String
		imageUrl: String
		content: String
	}

	type ArticleList {
		total: Int!
		items: [Article!]!
	}
`
