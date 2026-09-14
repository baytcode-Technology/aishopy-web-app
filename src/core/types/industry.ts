export type IndustryChild = {
  id: string
  name: string
  slug: string
}

export type IndustryGroup = {
  id: string
  name: string
  slug: string
  children: IndustryChild[]
}

export type ListIndustriesResponse = {
  success: boolean
  message: string
  data: {
    industries: IndustryGroup[]
    count: number
  }
}
