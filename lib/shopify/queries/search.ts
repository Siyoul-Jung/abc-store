export const SEARCH_QUERY = `
  query search($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    search(query: $query, types: PRODUCT, first: $first) {
      totalCount
      nodes {
        ... on Product {
          id title tags
          featuredImage { url altText }
          images(first: 2) { nodes { url altText } }
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { maxVariantPrice { amount currencyCode } }
          variants(first: 1) { nodes { id availableForSale } }
        }
      }
    }
  }
`

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
