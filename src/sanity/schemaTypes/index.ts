import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { postType } from "./postType";
import { authorType } from "./authorType";
import { user } from "./ecommerce/user";
import { address } from "./ecommerce/address";
import { category } from "./ecommerce/category";
import { product } from "./ecommerce/product";

import { cart } from "./ecommerce/cart";
import { order } from "./ecommerce/order";
import { orderItem } from "./ecommerce/orderItem";
import { course } from "./ecommerce/course";
import { team } from "./team";
import { attributeDefinition } from "./ecommerce/attribute-defination";
import { productVariant } from "./ecommerce/variant";
import { donation } from "./donationType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
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
    donation
  ],
};
