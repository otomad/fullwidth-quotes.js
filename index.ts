import * as chars from "./chars.js";
import { eastAsianWidthType, type WidthType } from "get-east-asian-width";

const segmenter = new Intl.Segmenter();

const charSets = {
	neutral: [
		chars.LEFT_DOUBLE_QUOTE,
		chars.RIGHT_DOUBLE_QUOTE,
		chars.LEFT_SINGLE_QUOTE,
		chars.RIGHT_SINGLE_QUOTE,
	],
	fullwidth: [
		chars.LEFT_DOUBLE_QUOTE_FULLWIDTH,
		chars.RIGHT_DOUBLE_QUOTE_FULLWIDTH,
		chars.LEFT_SINGLE_QUOTE_FULLWIDTH,
		chars.RIGHT_SINGLE_QUOTE_FULLWIDTH,
	],
	halfwidth: [
		chars.LEFT_DOUBLE_QUOTE_HALFWIDTH,
		chars.RIGHT_DOUBLE_QUOTE_HALFWIDTH,
		chars.LEFT_SINGLE_QUOTE_HALFWIDTH,
		chars.RIGHT_SINGLE_QUOTE_HALFWIDTH,
	],
};

/**
 * Convert a string to Unicode sequence that won't divide the variation selectors or something else
 * into single characters.
 * @param str - String.
 * @returns An array where each element is a valid Unicode Variation Sequences.
 */
export function toUnicodeStringSequence(str: string) {
	return Array.from(segmenter.segment(str), segment => segment.segment);
}

/**
 * Check if a character is fullwidth.
 * But treat hangul as halfwidth due to korean uses halfwidth punctuation marks,
 * and treat empty string as ambiguous.
 * @param char - Character.
 * @returns
 * East Asian Width | Returns
 * --- | ---
 * fullwidth | true
 * halfwidth | false
 * wide | true
 * narrow | false
 * neutral | false
 * ambiguous | null
 *
 * Special | Returns
 * --- | ---
 * Quote + VS1 | false
 * Quote + VS2 | true
 * Hangul | false
 * Empty String | null
 */
export function isFullwidth(char: string) {
	if (charSets.fullwidth.includes(char))
		// Explicit fullwidth quotation marks
		return true;
	else if (charSets.halfwidth.includes(char))
		// Explicit halfwidth quotation marks
		return false;
	else if (char.match(/\p{Script=Hangul}/u))
		// Treat hangul as halfwidth, because korean uses halfwidth punctuation marks.
		return false;
	const codePoint = char.codePointAt(0);
	if (codePoint === undefined)
		// Empty string, treat as ambiguous.
		return null;
	const width = eastAsianWidthType(codePoint)
	if (width === "ambiguous")
		return null;
	return width === "fullwidth" || width === "wide";
	// Treat neutral as halfwidth.
}

function shouldFullwidthInternal(str: string | string[], side: "start" | "end" | "both" = "both") {
	const sequence = typeof str === "string" ? toUnicodeStringSequence(str) : str;
	let fullwidth: boolean | undefined;
	let start = -1;
	if (side !== "end")
		for (start = 0; start < sequence.length; start++) {
			const char = sequence[start];
			const matched = isFullwidth(char);
			if (matched === null) continue;
			fullwidth = matched;
			break;
		}
	if (fullwidth) return true;
	if (side !== "start")
		for (let end = sequence.length - 1; end > start; end--) {
			const char = sequence[end];
			const matched = isFullwidth(char);
			if (matched === null) continue;
			fullwidth = matched;
			break;
		}
	return fullwidth === true;
}

/**
 * Determine whether a string should be enclosed in fullwidth brackets or quotation marks.
 *
 * @remarks Determine rules:
 * 1. Query whether the first or last characters of a string is full width characters, and return true if so.
 * 2. If there are ambiguous characters, query the second or penultimate characters, and so on.
 * 3. If the entire string contains ambiguous characters, return false.
 *
 * @param str - The string to determine.
 * @returns The string should be enclosed in fullwidth brackets or quotation marks.
 */
export function shouldFullwidth(str: string) {
	return shouldFullwidthInternal(str);
}

const VARIATION_SELECTORS = "[\\u180b-\\u180d\\ufe00-\\ufe0f\\u{e0100}-\\u{e01ef}]";
const QUOTES_NEUTRAL_REGEXP = /([“”‘’])/gu;
const QUOTES_SVS_REGEXP = new RegExp(`([“”‘’])${VARIATION_SELECTORS}*`, "gu");

/**
 * Always convert all quotation marks in the string to fullwidth, regardless of the context character.
 * @note Not recommended, recommended to use `enableSvsQuotes`.
 * @param str - String.
 * @param includesExplicit - If a quotation mark already contains any variation selector, should it be ignored and replaced? Defaults to false.
 * @returns Every quotation marks become fullwidth.
 */
export function alwaysToFullwidthQuotes(str: string, includesExplicit: boolean = false) {
	return str.replaceAll(includesExplicit ? QUOTES_SVS_REGEXP : QUOTES_NEUTRAL_REGEXP, "$1" + chars.FULLWIDTH_VS);
}

/**
 * Always convert all quotation marks in the string to halfwidth, regardless of the context character.
 * @note Not recommended, recommended to use `enableSvsQuotes`.
 * @param str - String.
 * @param includesExplicit - If a quotation mark already contains any variation selector, should it be ignored and replaced? Defaults to false.
 * @returns Every quotation marks become halfwidth.
 */
export function alwaysToHalfwidthQuotes(str: string, includesExplicit: boolean = false) {
	return str.replaceAll(includesExplicit ? QUOTES_SVS_REGEXP : QUOTES_NEUTRAL_REGEXP, "$1" + chars.HALFWIDTH_VS);
}

/**
 * Remove the variation selectors from all quotation marks to restore them to ambiguous pure characters.
 * @param str - String.
 * @returns Quotation marks with no variation selectors.
 */
export function disableSvsQuotes(str: string) {
	return str.replaceAll(QUOTES_SVS_REGEXP, "$1");
}

const getVs = (fullwidth: boolean) => fullwidth ? chars.FULLWIDTH_VS : chars.HALFWIDTH_VS;

/**
 * Convert CJK quotation marks to fullwidth according to Unicode Standardized Variation Sequence (SVS).
 * @param str - String.
 * @returns If quotation marks enclose the context of Chinese or Japanese (excluding Korean), then switch them to fullwidth.
 */
export function enableSvsQuotes(str: string) {
	const sequence = toUnicodeStringSequence(str);
	const stack: { quote: string; index: number }[] = [];
	for (let i = 0; i < sequence.length; i++) {
		const char = sequence[i];
		if (!charSets.neutral.includes(char[0]))
			continue;
		if (char[0] === chars.LEFT_DOUBLE_QUOTE || char[0] === chars.LEFT_SINGLE_QUOTE) {
			stack.push({ quote: char, index: i });
			continue;
		}
		if (char[0] === chars.RIGHT_DOUBLE_QUOTE || char[0] === chars.RIGHT_SINGLE_QUOTE) {
			const right = char, rightIndex = i, rightVs = right.slice(1);
			const _left = stack.pop();
			if (_left) {
				const { quote: left, index: leftIndex } = _left, leftVs = left.slice(1);
				if (leftVs && rightVs && leftVs === rightVs) continue;
				const fullwidth = shouldFullwidthInternal(sequence.slice(leftIndex + 1, rightIndex));
				const vs = getVs(fullwidth);
				sequence[leftIndex] = left[0] + vs;
				sequence[rightIndex] = right[0] + vs;
			} else { // Found the right quote but can't find the corresponding left quote.
				if (rightVs) continue;
				const fullwidth = shouldFullwidthInternal(sequence.slice(0, rightIndex), "end");
				sequence[rightIndex] = right[0] + getVs(fullwidth);
			}
			continue;
		}
	}
	if (stack.length) // Found the left quote but can't find the corresponding right quote.
		for (const _left of stack.reverse()) { // Downstream may not support `toReversed`.
			const { quote: left, index: leftIndex } = _left, leftVs = left.slice(1);
			if (leftVs) continue;
			const fullwidth = shouldFullwidthInternal(sequence.slice(leftIndex + 1), "start");
			sequence[leftIndex] = left[0] + getVs(fullwidth);
		}
	return sequence.join("");
}
