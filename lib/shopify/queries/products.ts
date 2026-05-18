export const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    tags
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      nodes {
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    careInstructions: metafield(namespace: "custom", key: "care_instructions") {
      value
    }
    shippingNotice: metafield(namespace: "custom", key: "shipping_notice") {
      value
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`

export const GET_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductFragment
      }
    }
  }
`

export const GET_PRODUCT_BY_ID_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductById($id: ID!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    product(id: $id) {
      ...ProductFragment
    }
  }
`

export const GET_COLLECTION_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetCollectionByHandle($handle: String!, $first: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $first, sortKey: CREATED, reverse: true) {
        nodes {
          ...ProductFragment
        }
      }
    }
  }
`

export const GET_PRODUCTS_SORTED_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductsSorted($first: Int!, $sortKey: ProductSortKeys!, $reverse: Boolean!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: $sortKey, reverse: $reverse) {
      nodes {
        ...ProductFragment
      }
    }
  }
`

export const GET_PRODUCTS_BY_TAG_SORTED_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductsByTagSorted($first: Int!, $tag: String!, $sortKey: ProductSortKeys!, $reverse: Boolean!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: $sortKey, reverse: $reverse, query: $tag) {
      nodes {
        ...ProductFragment
      }
    }
  }
`

export const GET_PRODUCTS_BY_TAG_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductsByTag($first: Int!, $tag: String!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: CREATED_AT, reverse: true, query: $tag) {
      nodes {
        ...ProductFragment
      }
    }
  }
`

export const GET_BEST_SELLING_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetBestSelling($first: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING, query: "available_for_sale:true") {
      nodes {
        ...ProductFragment
      }
    }
  }
`

export const GET_COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
`
