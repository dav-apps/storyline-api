export const typeDefs = `#graphql
	type Query {
		retrievePublisher(uuid: String!): Publisher
		listPublishers(
			random: Boolean
			limit: Int
			offset: Int
		): PublisherList!
		retrieveArticle(uuid: String!): Article
		listArticles(
			publishers: [String!]
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
		feeds(
			limit: Int
			offset: Int
		): FeedList!
		articles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type PublisherList {
		total: Int!
		items: [Publisher!]!
	}

	type Feed {
		uuid: String!
		url: String!
		name: String!
		description: String
		language: String
	}

	type FeedList {
		total: Int!
		items: [Feed!]!
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
		summary: String
	}

	type ArticleList {
		total: Int!
		items: [Article!]!
	}
`
