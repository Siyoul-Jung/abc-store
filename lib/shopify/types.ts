export type Locale = 'ko' | 'ja' | 'en'

export type ShopifyContext = {
  country: 'KR' | 'JP' | 'US'
  language: 'KO' | 'JA' | 'EN'
}

export type Money = {
  amount: string
  currencyCode: string
}

export type Image = {
  url: string
  altText: string | null
  width: number
  height: number
}

export type ProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
  selectedOptions: { name: string; value: string }[]
}

export type Product = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  featuredImage: Image | null
  images: { nodes: Image[] }
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  compareAtPriceRange: {
    maxVariantPrice: Money
  } | null
  variants: { nodes: ProductVariant[] }
  tags: string[]
  careInstructions: { value: string } | null
  shippingNotice: { value: string } | null
}

export type CartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: Money
    selectedOptions: { name: string; value: string }[]
    product: {
      id: string
      title: string
      featuredImage: Image | null
    }
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: { nodes: CartLine[] }
  cost: {
    subtotalAmount: Money
    totalAmount: Money
  }
}

export type Collection = {
  id: string
  handle: string
  title: string
  description: string
  image: Image | null
  products: { nodes: Product[] }
}
