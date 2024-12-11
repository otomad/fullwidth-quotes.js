# fullwidth-quotes

[![npm](https://img.shields.io/npm/v/fullwidth-quotes?logo=npm&logoColor=%23CB3837&label=npm&labelColor=white&color=%23CB3837)](https://www.npmjs.org/package/fullwidth-quotes)
[![GitHub](https://img.shields.io/npm/v/fullwidth-quotes?logo=github&label=GitHub&color=%23181717)](https://github.com/otomad/fullwidth-quotes.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)][license-url]

[license-url]: https://opensource.org/licenses/MIT

Convert CJK quotation marks to fullwidth according to Unicode Standardized Variation Sequence (SVS).

In [Unicode 16.0](https://www.unicode.org/versions/Unicode16.0.0/), it supports fullwidth quotation marks with variation selectors.

Character | Unicode | Name
--- | --- | ---
“&#xfe00; | U+201C U+FE00 | Halfwidth Left Double Quotation Mark
”&#xfe00; | U+201D U+FE00 | Halfwidth Right Double Quotation Mark
‘&#xfe00; | U+2018 U+FE00 | Halfwidth Left Single Quotation Mark
’&#xfe00; | U+2019 U+FE00 | Halfwidth Right Single Quotation Mark
“&#xfe01; | U+201C U+FE01 | Fullwidth Left Double Quotation Mark
”&#xfe01; | U+201D U+FE01 | Fullwidth Right Double Quotation Mark
‘&#xfe01; | U+2018 U+FE01 | Fullwidth Left Single Quotation Mark
’&#xfe01; | U+2019 U+FE01 | Fullwidth Right Single Quotation Mark

This library will help you to add variant selectors for quotation marks automatically.

It only effects on smart quotation marks (curly quotation marks) and will not have any effects on dumb quotation marks (straight quotation marks).

This requires font support, otherwise you won't be able to see the difference between the two.

## Installation

```bash
# npm
npm install fullwidth-quotes

# yarn
yarn add fullwidth-quotes

# pnpm
pnpm add fullwidth-quotes
```

## Usage
```javascript
import { enableSvsQuotes } from "fullwidth-quotes";
enableSvsQuotes("“Hello world!”"); // Add U+FE00 after the `“` and `”` characters.

import { LEFT_DOUBLE_QUOTE_FULLWIDTH, RIGHT_DOUBLE_QUOTE_FULLWIDTH } from "fullwidth-quotes/chars";
// You can also directly get the samples of these characters.
```

## API

#### `enableSvsQuotes`

Convert CJK quotation marks to fullwidth according to Unicode Standardized Variation Sequence (SVS).

If quotation marks enclose the context of Chinese or Japanese (excluding Korean), then switch them to fullwidth.

#### `disableSvsQuotes`

Remove the variation selectors from all quotation marks to restore them to ambiguous pure characters.

#### `alwaysToFullwidthQuotes` *(Not Recommended)*

Always convert all quotation marks in the string to fullwidth, regardless of the context character.

In the parameters, you can decide whether to ignore and replace any variation selector if a quotation mark already contain it.

#### `alwaysToHalfwidthQuotes` *(Not Recommended)*

Always convert all quotation marks in the string to halfwidth, regardless of the context character.

In the parameters, you can decide whether to ignore and replace any variation selector if a quotation mark already contain it.

#### `shouldFullwidth`

Determine whether a string should be enclosed in fullwidth brackets or quotation marks.

**Determine rules:**

1. Query whether the first or last characters of a string is full width characters, and return true if so.
2. If there are ambiguous characters, query the second or penultimate characters, and so on.
3. If the entire string contains ambiguous characters, return false.

#### `isFullwidth`

Check if a character is fullwidth.
But treat hangul as halfwidth due to korean uses halfwidth punctuation marks,
and treat empty string as ambiguous.

East Asian Width | Returns
--- | ---
fullwidth | true
halfwidth | false
wide | true
narrow | false
neutral | false
ambiguous | null

Special | Returns
--- | ---
Quote + VS1 | false
Quote + VS2 | true
Hangul | false
Empty String | null

#### `toUnicodeStringSequence`

Convert a string to Unicode sequence that won't divide the variation selectors or something else into single characters.

It will return an array where each element is a valid Unicode Variation Sequences.

## License

fullwidth-quotes is available under the [MIT License][license-url]. See the LICENSE file for more info.
