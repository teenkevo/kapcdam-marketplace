import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  CartSchema,
  addToCartSchema,
  updateCartItemSchema,
  syncCartSchema,
} from "../schema";

export const cartRouter = createTRPCRouter({
  getUserCart: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx }) => {
      const cart = await client.fetch(
        groq`
  *[_type == "cart" && user->clerkUserId == $clerkUserId][0] {
    cartItems[] {
      type,
      quantity,
      currentPrice,
      addedAt,
      type == "product" => {
        "product": product-> {
          _id,
          title,
          price,
          images,
          totalStock,
          variants[] {
            sku,
            price,
            stock,
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
          "image": images[0]
        }
      },
      preferredStartDate
    }
  }
`,
        { clerkUserId: ctx.auth.userId }
      );

      const parsedCart = CartSchema.parse(cart);

      return parsedCart;
    }),

  addToCart: protectedProcedure
    .input(addToCartSchema)
    .mutation(async ({ ctx, input }) => {
      const { item } = input;

      let cart = await client.fetch(
        groq`
        *[_type == "cart" && user->clerkUserId == $clerkUserId && isActive == true][0]`,
        { clerkUserId: ctx.auth.userId }
      );

      const userId = await client.fetch(
        groq`*[_type == "user" && clerkUserId == $id]`,
        { id: ctx.auth.userId }
      );

      if (!cart) {
        const newCart = {
          _type: "cart",
          user: { _type: "reference", _ref: userId },
          cartItems: [],
          itemCount: 0,
          subtotal: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        cart = await client.create(newCart);
      }

      const existingItemIndex = cart.cartItems?.findIndex((cartItem: any) => {
        if (item.type === "product") {
          return cartItem.product?._ref === item.product;
        }
        return cartItem.course?._ref === item.course;
      });

      const updatedItems = [...(cart.cartItems || [])];

      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        const newItem = {
          _key: `item-${Date.now()}`,
          type: item.type,
          quantity: item.quantity,
          currentPrice: item.currentPrice,
          addedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          ...(item.type === "product"
            ? { product: { _type: "reference", _ref: item.product } }
            : { course: { _type: "reference", _ref: item.course } }),
        };
        updatedItems.push(newItem);
      }

      const itemCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + item.currentPrice * item.quantity,
        0
      );

      const updatedCart = await client
        .patch(cart._id)
        .set({
          cartItems: updatedItems,
          itemCount,
          subtotal,
          updatedAt: new Date().toISOString(),
        })
        .commit();

      return updatedCart;
    }),

  updateCartItem: baseProcedure
    .input(updateCartItemSchema)
    .mutation(async ({ input }) => {
      const { cartId, itemId, quantity } = input;

      const cart = await client.fetch(
        `*[_type == "cart" && _id == $cartId][0]`,
        { cartId }
      );

      if (!cart) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart not found",
        });
      }

      let updatedItems = [...(cart.cartItems || [])];

      if (quantity === 0) {
        updatedItems = updatedItems.filter((item) => item._key !== itemId);
      } else {
        const itemIndex = updatedItems.findIndex(
          (item) => item._key === itemId
        );
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            quantity,
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      const itemCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + item.currentPrice * item.quantity,
        0
      );

      const updatedCart = await client
        .patch(cartId)
        .set({
          cartItems: updatedItems,
          itemCount,
          subtotal,
          updatedAt: new Date().toISOString(),
        })
        .commit();

      return updatedCart;
    }),

  clearCart: baseProcedure
    .input(z.object({ cartId: z.string() }))
    .mutation(async ({ input }) => {
      const updatedCart = await client
        .patch(input.cartId)
        .set({
          cartItems: [],
          itemCount: 0,
          subtotal: 0,
          updatedAt: new Date().toISOString(),
        })
        .commit();

      return updatedCart;
    }),

  syncCartToUser: baseProcedure
    .input(syncCartSchema)
    .mutation(async ({ input }) => {
      const { userId, localCartItems } = input;

      let userCart = await client.fetch(
        `*[_type == "cart" && user._ref == $userId && isActive == true][0]`,
        { userId }
      );

      const cartItems = localCartItems.map((item, index) => ({
        _key: `item-${Date.now()}-${index}`,
        type: item.type,
        quantity: item.quantity,
        currentPrice: item.currentPrice,
        addedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ...(item.type === "product"
          ? { product: { _type: "reference", _ref: item.product } }
          : { course: { _type: "reference", _ref: item.course } }),
      }));

      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.currentPrice * item.quantity,
        0
      );

      if (userCart) {
        const existingItems = userCart.cartItems || [];
        const mergedItems = [...existingItems];

        cartItems.forEach((newItem) => {
          const existingIndex = mergedItems.findIndex((existing) => {
            if (newItem.type === "product") {
              return existing.product?._ref === newItem.product?._ref;
            }
            return existing.course?._ref === newItem.course?._ref;
          });

          if (existingIndex !== -1) {
            mergedItems[existingIndex].quantity += newItem.quantity;
            mergedItems[existingIndex].lastUpdated = new Date().toISOString();
          } else {
            mergedItems.push(newItem);
          }
        });

        const mergedItemCount = mergedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const mergedSubtotal = mergedItems.reduce(
          (sum, item) => sum + item.currentPrice * item.quantity,
          0
        );

        userCart = await client
          .patch(userCart._id)
          .set({
            cartItems: mergedItems,
            itemCount: mergedItemCount,
            subtotal: mergedSubtotal,
            updatedAt: new Date().toISOString(),
          })
          .commit();
      } else {
        const newCart = {
          _type: "cart",
          user: { _type: "reference", _ref: userId },
          cartItems,
          itemCount,
          subtotal,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        userCart = await client.create(newCart);
      }

      return userCart;
    }),
});
