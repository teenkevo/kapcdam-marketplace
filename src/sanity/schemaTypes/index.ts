import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {user} from './user'
import {address} from './address'
import {category} from './product-category'
import {product} from './product'
import {productVariant} from './variant'
import {cart} from './cart'
import {order} from './order'
import {orderItem} from './orderItem'
import {course} from './course'
import {team} from './team'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, categoryType, postType, authorType, user, address, category, product, productVariant, cart, order, orderItem, course, team],
}
