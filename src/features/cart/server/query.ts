import { defineQuery } from "next-sanity";

export const CART_ITEMS_QUERY = defineQuery(`
  *[_type == "cart" && user->clerkUserId == $clerkUserId && isActive == true][0] {
    _id,
    itemCount,
    createdAt,
    updatedAt,
    isActive,
    cartItems[] {
      type,
      quantity,
      addedAt,
      preferredStartDate,
      selectedVariantSku,
      type == "product" => {
        "productId": product._ref
      },
      type == "course" => {
        "courseId": course._ref
      }
    }
  }
`);