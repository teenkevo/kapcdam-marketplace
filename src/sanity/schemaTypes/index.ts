import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { blogCategory } from "./categoryType";
import { postType } from "./postType";
import { authorType } from "./authorType";
import { user } from "./user";
import { address } from "./address";
import { category } from "./commerce/product-category";
import { product } from "./commerce/product";

import { cart } from "./cart";
import { order } from "./order";
import { orderItem } from "./orderItem";
import { course } from "./course";
import { team } from "./team";
import { attributeDefinition } from "./commerce/attribute-defination";
import { productVariant } from "./commerce/variant";

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
