export const PREDICTIVE_SEARCH_QUERY = `
  query predictiveSearch($query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, types: [PRODUCT], limitScope: EACH, limit: 6) {
      products {
        id
        title
        featuredImage { url altText }
        priceRange {
          minVariantPrice { amount currencyCode }
        }
      }
    }
  }
`
