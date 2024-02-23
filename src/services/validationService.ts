import { validationErrors } from "../errors.js"
import { urlRegex } from "../constants.js"

//#region Field validations
export function validateNameLength(name: string) {
	if (name.length < 2) {
		return validationErrors.nameTooShort
	} else if (name.length > 50) {
		return validationErrors.nameTooLong
	}
}

export function validateDescriptionLength(description: string) {
	if (description.length < 2) {
		return validationErrors.descriptionTooShort
	} else if (description.length > 400) {
		return validationErrors.descriptionTooLong
	}
}

export function validateUrl(url: string) {
	if (url.length == 0 || !urlRegex.test(url)) {
		return validationErrors.urlInvalid
	}
}

export function validateLogoUrl(logoUrl: string) {
	if (logoUrl.length == 0 || !urlRegex.test(logoUrl)) {
		return validationErrors.logoUrlInvalid
	}
}

export function validateLanguage(language: string) {
	if (
		!["en", "en-us", "en-gb", "de", "de-de", "de-at", "de-ch"].includes(
			language
		)
	) {
		return validationErrors.languageInvalid
	}
}
//#endregion
