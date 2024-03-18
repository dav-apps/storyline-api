import axios from "axios"
import { request, gql } from "graphql-request"
import { getApiBaseUrl, getNewApiBaseUrl } from "../utils.js"
import { List, UserApiResponse, TableObject, Notification } from "../types.js"

export async function getUser(accessToken: string): Promise<UserApiResponse> {
	if (accessToken == null) {
		return null
	}

	try {
		let response = await axios({
			method: "get",
			url: `${getApiBaseUrl()}/v1/user`,
			headers: {
				Authorization: accessToken
			}
		})

		return {
			status: response.status,
			data: {
				id: response.data.id,
				email: response.data.email,
				firstName: response.data.first_name,
				confirmed: response.data.confirmed,
				totalStorage: response.data.total_storage,
				usedStorage: response.data.used_storage,
				plan: response.data.plan,
				dev: response.data.dev,
				provider: response.data.provider,
				profileImage: response.data.profile_image,
				profileImageEtag: response.data.profile_image_etag
			}
		}
	} catch (error) {
		return {
			status: error.response?.status || 500,
			errors: error.response?.data?.errors
		}
	}
}

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

export async function createNotification(
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
			mutation CreateNotification(
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
				createNotification(
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
