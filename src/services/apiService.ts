import { request, gql } from "graphql-request"
import { getNewApiBaseUrl } from "../utils.js"
import { List, TableObject, Notification } from "../types.js"

export async function listTableObjectsByProperty(
	queryData: string,
	variables: {
		userId?: number
		appId: number
		tableName?: string
		propertyName: string
		propertyValue: string
		exact?: boolean
		limit?: number
		offset?: number
	}
): Promise<List<TableObject>> {
	let result = await request<{
		listTableObjectsByProperty: List<TableObject>
	}>(
		getNewApiBaseUrl(),
		gql`
			query ListTableObjectsByProperty(
				$userId: Int
				$appId: Int!
				$tableName: String
				$propertyName: String!
				$propertyValue: String!
				$exact: Boolean
				$limit: Int
				$offset: Int
			) {
				listTableObjectsByProperty(
					userId: $userId
					appId: $appId
					tableName: $tableName
					propertyName: $propertyName
					propertyValue: $propertyValue
					exact: $exact
					limit: $limit
					offset: $offset
				) {
					${queryData}
				}
			}
		`,
		variables,
		{
			Authorization: process.env.DAV_AUTH
		}
	)

	return result.listTableObjectsByProperty
}

export async function createNotificationForUser(
	queryData: string,
	variables: {
		uuid?: string
		userId: number
		appId: number
		time: number
		interval: number
		title: string
		body: string
		icon?: string
		image?: string
		href?: string
	}
): Promise<Notification> {
	let result = await request<{
		createNotification: Notification
	}>(
		getNewApiBaseUrl(),
		gql`
			mutation CreateNotificationForUser(
				$uuid: String
				$userId: Int!
				$appId: Int!
				$time: Int!
				$interval: Int!
				$title: String!
				$body: String!
				$icon: String
				$image: String
				$href: String
			) {
				createNotificationForUser(
					uuid: $uuid
					userId: $userId
					appId: $appId
					time: $time
					interval: $interval
					title: $title
					body: $body
					icon: $icon
					image: $image
					href: $href
				) {
					${queryData}
				}
			}
		`,
		variables,
		{
			Authorization: process.env.DAV_AUTH
		}
	)

	return result.createNotification
}
