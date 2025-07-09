import type { StructureResolver } from "sanity/structure";
import {
  DocumentIcon,
  TagIcon,
  UserIcon,
  PackageIcon,
  BookIcon,
  UsersIcon,
  CreditCardIcon,
} from "@sanity/icons";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("KAPCDAM CMS")
    .items([
      // Content Management
      S.documentTypeListItem("post").title("Blog Posts").icon(DocumentIcon),
      S.documentTypeListItem("category").title("Blog Categories").icon(TagIcon),
      S.documentTypeListItem("author").title("Authors").icon(UserIcon),

      S.divider(),

      // E-commerce Management
      S.documentTypeListItem("product_category")
        .title("Product Categories")
        .icon(TagIcon),
      S.documentTypeListItem("product").title("Products").icon(PackageIcon),
      S.documentTypeListItem("course").title("Courses").icon(BookIcon),
      S.documentTypeListItem("team").title("Team Members").icon(UsersIcon),

      S.divider(),

      // Orders & Customer Data
      S.documentTypeListItem("order").title("Orders"),
      S.documentTypeListItem("orderItem")
        .title("Order Items")
        .icon(CreditCardIcon),
      S.documentTypeListItem("user").title("Customer Accounts").icon(UserIcon),
      S.documentTypeListItem("cart")
        .title("Shopping Carts")
      

    ]);
