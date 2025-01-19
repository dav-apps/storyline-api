export const apiErrors = {
	unexpectedError: {
		code: "UNEXPECTED_ERROR",
		message: "Unexpected error"
	},
	notAuthenticated: {
		code: "NOT_AUTHENTICATED",
		message: "You are not authenticated",
		status: 401
	},
	actionNotAllowed: {
		code: "ACTION_NOT_ALLOWED",
		message: "Action not allowed",
		status: 403
	},
	contentTypeNotSupported: {
		code: "CONTENT_TYPE_NOT_SUPPORTED",
		message: "Content-Type not supported",
		status: 415
	},
	validationFailed: {
		code: "VALIDATION_FAILED",
		message: "Validation failed",
		status: 400
	},
	sessionExpired: {
		code: "SESSION_EXPIRED",
		message: "Session has expired and must be renewed",
		status: 403
	},
	publisherDoesNotExist: {
		code: "PUBLISHER_DOES_NOT_EXIST",
		message: "Publisher does not exist",
		status: 404
	}
}

export const validationErrors = {
	nameTooShort: "NAME_TOO_SHORT",
	descriptionTooShort: "DESCRIPTION_TOO_SHORT",
	nameTooLong: "NAME_TOO_LONG",
	descriptionTooLong: "DESCRIPTION_TOO_LONG",
	urlInvalid: "URL_INVALID",
	logoUrlInvalid: "LOGO_URL_INVALID",
	languageInvalid: "LANGUAGE_INVALID"
}
