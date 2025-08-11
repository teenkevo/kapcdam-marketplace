import type { StructureResolver } from "sanity/structure";
import {
  DocumentIcon,
  UserIcon,
  PackageIcon,
  BookIcon,
  UsersIcon,
  CreditCardIcon,
  LaunchIcon,
} from "@sanity/icons";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("KAPCDAM CMS")
    .items([
      // Content Management
      S.documentTypeListItem("post").title("Blog Posts").icon(DocumentIcon),

      S.documentTypeListItem("author").title("Authors").icon(UserIcon),

      S.divider(),
      S.documentTypeListItem("attributeDefinition").title(
        "Attribute Definations"
      ),
      S.documentTypeListItem("category").title("Product Categories"),
      S.documentTypeListItem("product").title("Products").icon(PackageIcon),
      S.documentTypeListItem("discountCodes").title("Discount Coupons"),
      S.documentTypeListItem("course").title("Courses").icon(BookIcon),
      S.documentTypeListItem("team").title("Team Members").icon(UsersIcon),
      S.documentTypeListItem("deliveryZone")
        .title("Delivery Zones")
        .icon(LaunchIcon),

      S.divider(),

      // Orders & Customer Data
      S.documentTypeListItem("order").title("Orders"),

      S.documentTypeListItem("user").title("Customer Accounts").icon(UserIcon),
      S.documentTypeListItem("address")
        .title("Customer Addresses")
        .icon(UserIcon),
      S.documentTypeListItem("cart").title("Shopping Carts"),
      S.documentTypeListItem("reviews").title("Ratings & Reviews"),
      S.documentTypeListItem("donation").title("Donations"),
    ]);
