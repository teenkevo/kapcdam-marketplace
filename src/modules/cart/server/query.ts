import { defineQuery } from "next-sanity";

export const CART_ITEMS_QUERY = defineQuery(`
  *[_type == "cart" && user->clerkUserId == $clerkUserId][0] {
    _id,
    itemCount,
    subtotal,
    createdAt,
    updatedAt,
    isActive,
    cartItems[] {
      _key,
      type,
      quantity,
      currentPrice,
      addedAt,
      lastUpdated,
      selectedVariantSku,
      type == "product" => {
        "product": product-> {
          _id,
          title,
          price,
          hasVariants,
          totalStock,
          "defaultImage": images[isDefault == true][0].asset,
          "selectedVariant": variants[sku == ^.selectedVariantSku][0] {
            sku,
            price,
            "stock": totalStock,
            attributes[] {
              "id": attributeRef._ref,
              "name": attributeRef->name,
              "value": value
            }
          }
        }
      },
      type == "course" => {
        "course": course-> {
          _id,
          title,
          price,
          "defaultImage": images[0].asset
        }
      },
      preferredStartDate
    }
  }
`);
