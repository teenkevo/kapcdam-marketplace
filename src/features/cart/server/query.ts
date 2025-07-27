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

export const CART_DISPLAY_QUERY = defineQuery(`
{
  "products": *[_type == "product" && _id in $productIds] {
    _id,
    title,
    price,
    hasVariants,
    totalStock,
    "defaultImage": coalesce(images[isDefault == true][0], images[0]),
    "variants": variants[sku in $selectedSKUs] {
      sku,
      price,
      totalStock,
      isDefault,
      attributes[] {
        "id": attributeRef._ref,
        "name": attributeRef->name,
        "value": value
      }
    }
  },
  "courses": *[_type == "course" && _id in $courseIds] {
    _id,
    title,
    price,
    "defaultImage": coalesce(images[isDefault == true][0], images[0])
  }
}
`);
