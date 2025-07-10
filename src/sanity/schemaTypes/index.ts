import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { blogCategory } from "./categoryType";
import { postType } from "./postType";
import { authorType } from "./authorType";
import { user } from "./user";
import { address } from "./address";
import { category } from "./ecommerce/product-category";
import { product } from "./ecommerce/product";

import { cart } from "./ecommerce/cart";
import { order } from "./ecommerce/order";
import { orderItem } from "./ecommerce/orderItem";
import { course } from "./course";
import { team } from "./team";
import { attributeDefinition } from "./ecommerce/attribute-defination";
import { productVariant } from "./ecommerce/variant";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    blogCategory,
    postType,
    authorType,
    user,
    address,
    category,
    product,
    productVariant,
    cart,
    order,
    orderItem,
    attributeDefinition,
    course,
    team,
  ],
};
